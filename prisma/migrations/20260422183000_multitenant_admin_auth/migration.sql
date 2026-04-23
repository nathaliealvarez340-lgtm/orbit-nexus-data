ALTER TABLE "companies"
ADD COLUMN "codePrefix" TEXT,
ADD COLUMN "registrationCode" TEXT;

UPDATE "companies"
SET "codePrefix" = COALESCE(
  NULLIF(
    UPPER(
      CASE
        WHEN array_length(regexp_split_to_array(regexp_replace("name", '[^A-Za-z ]', '', 'g'), '\s+'), 1) >= 2
          THEN CONCAT(
            LEFT((regexp_split_to_array(regexp_replace("name", '[^A-Za-z ]', '', 'g'), '\s+'))[1], 1),
            LEFT((regexp_split_to_array(regexp_replace("name", '[^A-Za-z ]', '', 'g'), '\s+'))[2], 1)
          )
        ELSE LEFT(regexp_replace("name", '[^A-Za-z]', '', 'g'), 2)
      END
    ),
    ''
  ),
  'NX'
)
WHERE "codePrefix" IS NULL;

UPDATE "companies"
SET "registrationCode" = CONCAT("codePrefix", '-LEAD-', UPPER(SUBSTRING(MD5("id") FROM 1 FOR 6)))
WHERE "registrationCode" IS NULL;

ALTER TABLE "companies"
ALTER COLUMN "codePrefix" SET NOT NULL,
ALTER COLUMN "registrationCode" SET NOT NULL;

CREATE UNIQUE INDEX "companies_codePrefix_key" ON "companies"("codePrefix");
CREATE UNIQUE INDEX "companies_registrationCode_key" ON "companies"("registrationCode");

ALTER TABLE "users"
ADD COLUMN "createdByLeaderId" TEXT,
ADD COLUMN "disabledAt" TIMESTAMP(3);

ALTER TABLE "projects"
ADD COLUMN "clientContactName" TEXT,
ADD COLUMN "clientContactEmail" TEXT;

