# Erie.Pro Live Service Inventory

Date checked: 2026-05-10
Live URL checked: https://www.erie.pro

The live Erie.Pro homepage says "Browse all 112 services" and the main request form includes a 112-option service dropdown. This is the source of truth for ConvertBox planning unless the deployed site changes again.

## Live Structure Notes

- The live sitemap contains 3,505 public URLs.
- The live `/services` page confirms all 112 service groups.
- The first 44 services expose 8 listed subservice intents each on `/services`.
- The remaining 68 services expose 5 listed subservice intents each on `/services`.
- Most services have canonical service-route clusters: main page, blog, guides, FAQ, pricing, costs, compare, emergency, glossary, seasonal, checklist, directory, reviews, tips, certifications, and provider pages when provider inventory exists.
- Some route slugs differ from the plain label slug. Examples:
  - `Windows & Doors` -> `/windows-doors`
  - `Foundation & Waterproofing` -> `/foundation`
  - `Concrete & Masonry` -> `/concrete`
  - `Septic & Sewer` -> `/septic`
  - `Chimney & Fireplace` -> `/chimney`
  - `Pool & Spa Services` -> `/pool-spa`
  - `Gutter Services` -> `/gutters`
  - `Drywall & Plastering` -> `/drywall`
  - `Demolition & Excavation` -> `/demolition`
  - `Decks & Patios` -> `/decks-patios`
  - `Closet & Storage Systems` -> `/closet-storage-systems`
  - `Radon Testing & Mitigation` -> `/radon-testing-mitigation`
  - `Dock Installation & Repair` -> `/dock-installation-repair`
  - `Salt & De-Icing Services` -> `/salt-deicing-services`

## Live Services

1. Plumbing
2. HVAC
3. Electrical
4. Roofing
5. Landscaping
6. Dental
7. Legal
8. Cleaning
9. Auto Repair
10. Pest Control
11. Painting
12. Real Estate
13. Garage Door
14. Fencing
15. Flooring
16. Windows & Doors
17. Moving
18. Tree Service
19. Appliance Repair
20. Foundation & Waterproofing
21. Home Security
22. Concrete & Masonry
23. Septic & Sewer
24. Chimney & Fireplace
25. Pool & Spa Services
26. Locksmith Services
27. Towing & Roadside Assistance
28. Carpet Cleaning
29. Pressure Washing
30. Drywall & Plastering
31. Insulation Services
32. Solar & Energy
33. Gutter Services
34. Handyman Services
35. Veterinary Services
36. Chiropractic Care
37. Accounting & Tax
38. Photography Services
39. Pet Grooming
40. Snow Removal
41. Water Damage Restoration
42. Glass & Glazing
43. Irrigation & Sprinklers
44. Demolition & Excavation
45. General Contractor
46. Home Remodeling
47. Kitchen Remodeling
48. Bathroom Remodeling
49. Siding
50. Decks & Patios
51. Basement Finishing
52. Mold Remediation
53. Fire Damage Restoration
54. Storm Damage Repair
55. Water Heater Services
56. Drain Cleaning
57. Sewer Line Repair
58. AC Repair
59. Furnace Repair
60. Duct Cleaning
61. Driveway Paving
62. Asphalt Sealing
63. Junk Removal
64. Dumpster Rental
65. Home Inspection
66. Property Management
67. Rental Turnover Cleaning
68. Commercial Cleaning
69. Commercial Snow Removal
70. Home Builders
71. Outdoor Lighting
72. Holiday Lighting
73. Fence Repair
74. Retaining Walls
75. Epoxy Flooring
76. Closet & Storage Systems
77. Cabinet Refinishing
78. Countertops
79. Tile Installation
80. Smart Home Installation
81. EV Charger Installation
82. Generator Installation
83. Radon Testing & Mitigation
84. Wildlife Removal
85. Bat Removal
86. Bee/Wasp Removal
87. Septic Inspection
88. Well Water Testing
89. Boat Repair / Marine Services
90. Dock Installation & Repair
91. Marina / Boat Winterization
92. Ice Dam Removal
93. Emergency Board-Up
94. Basement Flood Cleanup
95. Lakefront Property Maintenance
96. Vacation Rental Cleaning
97. Airbnb Property Management
98. Snow Plow Contractors
99. Salt & De-Icing Services
100. Storm Window Repair
101. Optometry
102. Dermatology
103. Physical Therapy
104. Mental Health Counseling
105. Senior Home Care
106. Home Health Care
107. Hearing Aids / Audiology
108. Funeral Homes
109. Insurance Agents
110. Financial Advisors
111. Mortgage Brokers
112. Estate Sale Services

## Planning Correction

The earlier repo-derived "44 top-level categories" should be treated as the core SEO/content catalog, not the complete live conversion catalog.

For ConvertBox, the live service catalog should be organized into service families:

- Emergency home response
- Planned home projects
- Seasonal Erie services
- Cleaning and turnover
- Vehicle and roadside
- Health and wellness appointments
- Professional services
- Property, real estate, and finance
- Lakefront, marine, and vacation rental services
- Provider-side territory claim flows

## Next Blueprint Step

Create service-family ConvertBox templates first, then branch each of the 112 services into:

- urgency level
- visitor psychology
- subservice choices
- qualifying questions
- recommended ConvertBox flow
- routing metadata
- suppression/frequency rules
- follow-up expectations
