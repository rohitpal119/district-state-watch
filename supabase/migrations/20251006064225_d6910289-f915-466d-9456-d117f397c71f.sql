-- Insert sample contractor user for testing
-- This contractor will be assigned to 2 projects

-- Update projects table to assign contractor_id to sample projects
-- Assuming the contractor user ID will be created through signup, we'll use a placeholder
-- Users can manually update these after creating a contractor account

-- Add some sample data for testing contractor features
-- Note: Replace 'CONTRACTOR_USER_ID' with actual contractor user ID after signup

COMMENT ON TABLE projects IS 'Projects assigned to contractors for PM-AJAY program';
COMMENT ON TABLE contractor_communications IS 'Communication messages between contractors and district collectors';
COMMENT ON TABLE contractor_fund_updates IS 'Fund utilization updates submitted by contractors';
COMMENT ON TABLE project_image_updates IS 'Progress images uploaded by contractors including AR and 360 images';