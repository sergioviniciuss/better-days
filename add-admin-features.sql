-- Add admin features to Better Days
-- This migration adds support for challenge rule updates and participant acknowledgments

-- Add rulesUpdatedAt to Challenge table
-- This tracks when the challenge rules were last updated by the admin
ALTER TABLE "Challenge" 
ADD COLUMN "rulesUpdatedAt" TIMESTAMP(3);

-- Add lastAcknowledgedRulesAt to ChallengeMember table
-- This tracks when a member last acknowledged rule changes
ALTER TABLE "ChallengeMember" 
ADD COLUMN "lastAcknowledgedRulesAt" TIMESTAMP(3);

-- Both columns are nullable:
-- - rulesUpdatedAt is null if rules have never been updated after creation
-- - lastAcknowledgedRulesAt is null if member hasn't acknowledged any rule changes
-- When rulesUpdatedAt > lastAcknowledgedRulesAt (or lastAcknowledgedRulesAt is null),
-- the member must acknowledge the rule changes before continuing to log.

