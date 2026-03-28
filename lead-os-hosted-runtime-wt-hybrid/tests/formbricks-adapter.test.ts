import test from "node:test";
import assert from "node:assert/strict";
import {
  createSurvey,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  listSurveys,
  submitResponse,
  getResponses,
  getResponseAnalytics,
  createQualificationSurvey,
  createNPSSurvey,
  createFeedbackSurvey,
  scoreResponseForLeadQualification,
  resetFormbricksStore,
  _getSurveyStoreForTesting,
} from "../src/lib/integrations/formbricks-adapter.ts";

// ---------------------------------------------------------------------------
// createSurvey + getSurvey
// ---------------------------------------------------------------------------

test("createSurvey creates a survey and getSurvey retrieves it", async () => {
  resetFormbricksStore();
  const tenantId = `fb-test-${Date.now()}`;
  const survey = await createSurvey(tenantId, {
    name: "Test Survey",
    type: "custom",
    questions: [
      { id: "q1", type: "text", text: "What is your name?", required: true },
    ],
  });

  assert.ok(survey.id.startsWith("survey-"));
  assert.equal(survey.tenantId, tenantId);
  assert.equal(survey.name, "Test Survey");
  assert.equal(survey.type, "custom");
  assert.equal(survey.status, "active");
  assert.equal(survey.responseCount, 0);
  assert.equal(survey.questions.length, 1);

  const retrieved = await getSurvey(survey.id);
  assert.equal(retrieved.id, survey.id);
});

// ---------------------------------------------------------------------------
// listSurveys scoped to tenant
// ---------------------------------------------------------------------------

test("listSurveys returns surveys scoped to tenant", async () => {
  resetFormbricksStore();
  const t1 = `fb-t1-${Date.now()}`;
  const t2 = `fb-t2-${Date.now()}`;

  await createSurvey(t1, { name: "S1", type: "custom", questions: [{ id: "q1", type: "text", text: "Q?", required: true }] });
  await createSurvey(t2, { name: "S2", type: "nps", questions: [{ id: "q1", type: "nps", text: "NPS?", required: true }] });
  await createSurvey(t1, { name: "S3", type: "feedback", questions: [{ id: "q1", type: "rating", text: "Rate?", required: true }] });

  const t1Surveys = await listSurveys(t1);
  const t2Surveys = await listSurveys(t2);

  assert.equal(t1Surveys.length, 2);
  assert.equal(t2Surveys.length, 1);
  assert.equal(t2Surveys[0]!.name, "S2");
});

// ---------------------------------------------------------------------------
// updateSurvey
// ---------------------------------------------------------------------------

test("updateSurvey modifies survey fields", async () => {
  resetFormbricksStore();
  const tenantId = `fb-update-${Date.now()}`;
  const survey = await createSurvey(tenantId, {
    name: "Original",
    type: "custom",
    questions: [{ id: "q1", type: "text", text: "Q?", required: true }],
  });

  const updated = await updateSurvey(survey.id, { name: "Updated Name" });

  assert.equal(updated.name, "Updated Name");
  assert.equal(updated.type, "custom");
});

// ---------------------------------------------------------------------------
// deleteSurvey
// ---------------------------------------------------------------------------

test("deleteSurvey removes a survey from the store", async () => {
  resetFormbricksStore();
  const tenantId = `fb-del-${Date.now()}`;
  const survey = await createSurvey(tenantId, {
    name: "Delete Me",
    type: "custom",
    questions: [{ id: "q1", type: "text", text: "Q?", required: true }],
  });

  await deleteSurvey(survey.id);

  assert.equal(_getSurveyStoreForTesting().has(survey.id), false);
  await assert.rejects(() => getSurvey(survey.id), /not found/);
});

// ---------------------------------------------------------------------------
// submitResponse + getResponses
// ---------------------------------------------------------------------------

test("submitResponse records a response and updates responseCount", async () => {
  resetFormbricksStore();
  const tenantId = `fb-resp-${Date.now()}`;
  const survey = await createSurvey(tenantId, {
    name: "Response Test",
    type: "custom",
    questions: [
      { id: "q1", type: "text", text: "Name?", required: true },
      { id: "q2", type: "rating", text: "Rate us?", required: true },
    ],
  });

  const response = await submitResponse(survey.id, "visitor-1", [
    { questionId: "q1", value: "Alice" },
    { questionId: "q2", value: 5 },
  ]);

  assert.ok(response.id.startsWith("resp-"));
  assert.equal(response.surveyId, survey.id);
  assert.equal(response.answers.length, 2);

  const responses = await getResponses(survey.id);
  assert.equal(responses.length, 1);

  const updatedSurvey = await getSurvey(survey.id);
  assert.equal(updatedSurvey.responseCount, 1);
});

// ---------------------------------------------------------------------------
// getResponseAnalytics
// ---------------------------------------------------------------------------

test("getResponseAnalytics returns breakdown of responses", async () => {
  resetFormbricksStore();
  const tenantId = `fb-analytics-${Date.now()}`;
  const survey = await createSurvey(tenantId, {
    name: "Analytics Test",
    type: "custom",
    questions: [
      { id: "q1", type: "multiChoice", text: "Favorite color?", required: true, options: ["Red", "Blue", "Green"] },
    ],
  });

  await submitResponse(survey.id, "v1", [{ questionId: "q1", value: "Red" }]);
  await submitResponse(survey.id, "v2", [{ questionId: "q1", value: "Blue" }]);
  await submitResponse(survey.id, "v3", [{ questionId: "q1", value: "Red" }]);

  const analytics = await getResponseAnalytics(survey.id);

  assert.equal(analytics.totalResponses, 3);
  assert.equal(analytics.questionBreakdown.length, 1);
  assert.equal(analytics.questionBreakdown[0]!.responseDistribution["Red"], 2);
  assert.equal(analytics.questionBreakdown[0]!.responseDistribution["Blue"], 1);
});

// ---------------------------------------------------------------------------
// createQualificationSurvey
// ---------------------------------------------------------------------------

test("createQualificationSurvey builds a qualification survey with scored questions", async () => {
  resetFormbricksStore();
  const tenantId = `fb-qual-${Date.now()}`;
  const survey = await createQualificationSurvey(tenantId, "default");

  assert.ok(survey.name.includes("Qualification"));
  assert.equal(survey.type, "qualification");
  assert.ok(survey.questions.length >= 4);
  assert.ok(survey.questions.some((q) => q.scoreWeight !== undefined && q.scoreWeight > 0));
});

// ---------------------------------------------------------------------------
// createNPSSurvey + createFeedbackSurvey
// ---------------------------------------------------------------------------

test("createNPSSurvey builds an NPS survey", async () => {
  resetFormbricksStore();
  const tenantId = `fb-nps-${Date.now()}`;
  const survey = await createNPSSurvey(tenantId);

  assert.equal(survey.name, "Net Promoter Score");
  assert.equal(survey.type, "nps");
  assert.ok(survey.questions.some((q) => q.type === "nps"));
});

test("createFeedbackSurvey builds a feedback survey", async () => {
  resetFormbricksStore();
  const tenantId = `fb-feedback-${Date.now()}`;
  const survey = await createFeedbackSurvey(tenantId);

  assert.equal(survey.name, "Customer Feedback");
  assert.equal(survey.type, "feedback");
  assert.ok(survey.questions.some((q) => q.type === "rating"));
});

// ---------------------------------------------------------------------------
// scoreResponseForLeadQualification
// ---------------------------------------------------------------------------

test("scoreResponseForLeadQualification scores a hot lead correctly", async () => {
  resetFormbricksStore();
  const tenantId = `fb-score-${Date.now()}`;
  const survey = await createQualificationSurvey(tenantId, "default");

  const response = await submitResponse(survey.id, "hot-lead", [
    { questionId: "q-budget", value: "Over $20k" },
    { questionId: "q-timeline", value: "Immediately" },
    { questionId: "q-decision", value: "Yes" },
    { questionId: "q-pain", value: "We are losing leads every day and need help urgently" },
    { questionId: "q-size", value: "50+" },
  ]);

  const score = await scoreResponseForLeadQualification(response);

  assert.equal(score.tier, "hot");
  assert.ok(score.score >= 70);
  assert.ok(score.signals.includes("High budget"));
  assert.ok(score.signals.includes("Immediate need"));
  assert.ok(score.signals.includes("Decision maker"));
  assert.ok(score.suggestedAction.length > 0);
});

test("scoreResponseForLeadQualification scores a cold lead correctly", async () => {
  resetFormbricksStore();
  const tenantId = `fb-cold-${Date.now()}`;
  const survey = await createQualificationSurvey(tenantId, "default");

  const response = await submitResponse(survey.id, "cold-lead", [
    { questionId: "q-budget", value: "Under $1k" },
    { questionId: "q-timeline", value: "Just exploring" },
    { questionId: "q-decision", value: "Researching for someone else" },
    { questionId: "q-pain", value: "curious" },
  ]);

  const score = await scoreResponseForLeadQualification(response);

  assert.equal(score.tier, "cold");
  assert.ok(score.score < 40);
  assert.ok(score.signals.includes("Low budget"));
  assert.ok(score.signals.includes("Exploring"));
});
