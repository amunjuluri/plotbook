-- AlterTable
ALTER TABLE "user" ADD COLUMN     "canAccessDashboard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canAccessSavedProperties" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canAccessTeamManagement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "domain" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "county" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fipsCode" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "population" INTEGER,
    "area" DOUBLE PRECISION,
    "medianIncome" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "county_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "countyId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "population" INTEGER,
    "area" DOUBLE PRECISION,
    "medianIncome" DOUBLE PRECISION,
    "zipCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "streetNumber" TEXT,
    "streetName" TEXT,
    "unit" TEXT,
    "zipCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "propertyType" TEXT NOT NULL,
    "buildingType" TEXT,
    "yearBuilt" INTEGER,
    "squareFootage" INTEGER,
    "lotSize" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "stories" INTEGER,
    "currentValue" DOUBLE PRECISION,
    "assessedValue" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "lastSalePrice" DOUBLE PRECISION,
    "lastSaleDate" TIMESTAMP(3),
    "stateId" TEXT NOT NULL,
    "countyId" TEXT,
    "cityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataSource" TEXT,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_ownership" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL,
    "ownershipPercent" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_transaction" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "buyerId" TEXT,
    "sellerId" TEXT,
    "documentType" TEXT,
    "recordingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "middleName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "ssn" TEXT,
    "entityName" TEXT,
    "entityType" TEXT,
    "ein" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mailingAddress" TEXT,
    "estimatedNetWorth" DOUBLE PRECISION,
    "wealthConfidence" DOUBLE PRECISION,
    "wealthLastUpdated" TIMESTAMP(3),
    "wealthSources" TEXT[],
    "occupation" TEXT,
    "employer" TEXT,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataSource" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wealth_breakdown" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "dataSource" TEXT,

    CONSTRAINT "wealth_breakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_property" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search_filter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_search_filter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "apiKey" TEXT,
    "lastSync" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "state_name_key" ON "state"("name");

-- CreateIndex
CREATE UNIQUE INDEX "state_code_key" ON "state"("code");

-- CreateIndex
CREATE UNIQUE INDEX "county_fipsCode_key" ON "county"("fipsCode");

-- CreateIndex
CREATE UNIQUE INDEX "county_name_stateId_key" ON "county"("name", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "city_name_stateId_key" ON "city"("name", "stateId");

-- CreateIndex
CREATE INDEX "property_latitude_longitude_idx" ON "property"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "property_zipCode_idx" ON "property"("zipCode");

-- CreateIndex
CREATE INDEX "property_propertyType_idx" ON "property"("propertyType");

-- CreateIndex
CREATE INDEX "property_currentValue_idx" ON "property"("currentValue");

-- CreateIndex
CREATE UNIQUE INDEX "property_ownership_propertyId_ownerId_startDate_key" ON "property_ownership"("propertyId", "ownerId", "startDate");

-- CreateIndex
CREATE INDEX "property_transaction_date_idx" ON "property_transaction"("date");

-- CreateIndex
CREATE INDEX "property_transaction_amount_idx" ON "property_transaction"("amount");

-- CreateIndex
CREATE INDEX "owner_lastName_firstName_idx" ON "owner"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "owner_entityName_idx" ON "owner"("entityName");

-- CreateIndex
CREATE INDEX "owner_estimatedNetWorth_idx" ON "owner"("estimatedNetWorth");

-- CreateIndex
CREATE UNIQUE INDEX "wealth_breakdown_ownerId_category_key" ON "wealth_breakdown"("ownerId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "saved_property_userId_propertyId_key" ON "saved_property"("userId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "data_source_name_key" ON "data_source"("name");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "county" ADD CONSTRAINT "county_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "county"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "county"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_ownership" ADD CONSTRAINT "property_ownership_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_ownership" ADD CONSTRAINT "property_ownership_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_transaction" ADD CONSTRAINT "property_transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_transaction" ADD CONSTRAINT "property_transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_transaction" ADD CONSTRAINT "property_transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wealth_breakdown" ADD CONSTRAINT "wealth_breakdown_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_property" ADD CONSTRAINT "saved_property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_property" ADD CONSTRAINT "saved_property_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_filter" ADD CONSTRAINT "saved_search_filter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
