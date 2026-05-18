-- Enable RLS on agent_configs table
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read agent configs (admins need this)
CREATE POLICY "Allow authenticated users to read agent configs"
  ON agent_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to update agent configs (admin only in practice)
CREATE POLICY "Allow authenticated users to update agent configs"
  ON agent_configs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to insert agent configs
CREATE POLICY "Allow authenticated users to insert agent configs"
  ON agent_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);