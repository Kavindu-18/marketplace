/**
 * Phase 1 comprehensive seed.
 *
 * Run:
 *   pnpm --filter @marketplace/api seed
 *
 * Idempotent — safe to run multiple times. Uses upsert on unique fields.
 * Directly sets ProviderProfile.status = VERIFIED and Service.status = ACTIVE/PENDING_VERIFICATION
 * without going through the state machine (seed data, not an API test).
 */
import { PrismaClient, ProviderStatus, ServiceStatus, DocumentType, Vertical } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  // VEHICLE_SERVICE
  { name: 'Auto Maintenance',    slug: 'auto-maintenance',   vertical: Vertical.VEHICLE_SERVICE },
  { name: 'Tyre & Wheel',        slug: 'tyre-wheel',         vertical: Vertical.VEHICLE_SERVICE },
  { name: 'Auto Electrical',     slug: 'auto-electrical',    vertical: Vertical.VEHICLE_SERVICE },
  { name: 'Vehicle Inspection',  slug: 'vehicle-inspection', vertical: Vertical.VEHICLE_SERVICE },
  // CONSULTATION
  { name: 'Legal Advice',        slug: 'legal-advice',       vertical: Vertical.CONSULTATION },
  { name: 'Medical Consultation',slug: 'medical-consultation',vertical: Vertical.CONSULTATION },
  { name: 'IT Support',          slug: 'it-support',         vertical: Vertical.CONSULTATION },
  { name: 'Home Repair',         slug: 'home-repair',        vertical: Vertical.CONSULTATION },
  { name: 'Tutoring',            slug: 'tutoring',           vertical: Vertical.CONSULTATION },
] as const;

// ── Providers ───────────────────────────────────────────────────────────────
// Coords spread around Colombo / Homagama so distance sorting is visible
// when searching from Colombo Fort (6.9271, 79.8612).
//
// Approx distances from Fort:
//  Cinnamon Gardens  6.9194, 79.8656  ~1 km
//  Borella           6.9157, 79.8748  ~2 km
//  Kollupitiya       6.9019, 79.8563  ~3 km
//  Nugegoda          6.8710, 79.8890  ~8 km
//  Maharagama        6.8469, 79.9258 ~14 km
//  Homagama          6.8428, 79.9163 ~14 km

const PROVIDERS = [
  {
    email: 'cinnamon.it@seed.lk',
    password: 'Seed@12345',
    businessName: 'Cinnamon IT Solutions',
    description: 'Expert IT support and software development for individuals and small businesses in Colombo.',
    contactPhone: '+94711000001',
    contactEmail: 'hello@cinnamonit.lk',
    addressLine: '22 Gregory\'s Road',
    city: 'Colombo 7',
    district: 'Colombo',
    lat: 6.9194,
    lng: 79.8656,
    categorySlug: 'it-support',
    services: [
      { title: 'On-site Laptop Repair', description: 'Diagnosis and repair of hardware/software faults for laptops and desktops. Same-day service available.', priceInfo: 'From LKR 2,500', status: ServiceStatus.ACTIVE },
      { title: 'Website Development', description: 'Custom business websites built with React or WordPress. Includes hosting setup and 1-month support.', priceInfo: 'From LKR 35,000', status: ServiceStatus.PENDING_VERIFICATION },
    ],
  },
  {
    email: 'borella.tyres@seed.lk',
    password: 'Seed@12345',
    businessName: 'Borella Tyre Centre',
    description: 'All tyre brands, fast fitting, wheel balancing and alignment. Serving Colombo for 12 years.',
    contactPhone: '+94711000002',
    contactEmail: 'info@borellatyres.lk',
    addressLine: '88 Baseline Road',
    city: 'Borella',
    district: 'Colombo',
    lat: 6.9157,
    lng: 79.8748,
    categorySlug: 'tyre-wheel',
    services: [
      { title: 'Tyre Replacement', description: 'Supply and fit of any tyre brand. All passenger car and SUV sizes in stock.', priceInfo: 'From LKR 6,500 per tyre', status: ServiceStatus.ACTIVE },
      { title: 'Wheel Alignment & Balancing', description: '4-wheel laser alignment and computerised balancing. Takes under 45 minutes.', priceInfo: 'LKR 2,200', status: ServiceStatus.ACTIVE },
    ],
  },
  {
    email: 'perera.auto@seed.lk',
    password: 'Seed@12345',
    businessName: 'Perera Auto Services',
    description: 'Full vehicle servicing, oil changes, brake work and pre-purchase inspections. Based in Kollupitiya.',
    contactPhone: '+94711000003',
    contactEmail: 'perera.auto@gmail.com',
    addressLine: '45 Galle Road',
    city: 'Colombo 3',
    district: 'Colombo',
    lat: 6.9019,
    lng: 79.8563,
    categorySlug: 'auto-maintenance',
    services: [
      { title: 'Full Car Service (A/B/C)', description: 'Engine oil, oil filter, air filter, spark plugs, brake inspection and fluid top-up. All makes.', priceInfo: 'From LKR 8,500', status: ServiceStatus.ACTIVE },
      { title: 'Pre-Purchase Inspection', description: 'Comprehensive 60-point check before buying a used car. Written report provided.', priceInfo: 'LKR 4,500', status: ServiceStatus.PENDING_VERIFICATION },
    ],
  },
  {
    email: 'silva.legal@seed.lk',
    password: 'Seed@12345',
    businessName: 'Silva & Associates',
    description: 'Experienced attorneys covering land, family, commercial and employment law. Initial consultation free.',
    contactPhone: '+94711000004',
    contactEmail: 'attorneys@silvalaw.lk',
    addressLine: '12 Law College Road',
    city: 'Nugegoda',
    district: 'Colombo',
    lat: 6.8710,
    lng: 79.8890,
    categorySlug: 'legal-advice',
    services: [
      { title: 'Legal Consultation', description: 'One-hour session covering your legal situation, rights and recommended next steps. All practice areas.', priceInfo: 'LKR 5,000 / hr', status: ServiceStatus.ACTIVE },
      { title: 'Contract Drafting & Review', description: 'Professional review or drafting of commercial contracts, leases, and sale agreements.', priceInfo: 'From LKR 8,000', status: ServiceStatus.ACTIVE },
    ],
  },
  {
    email: 'hasitha.repairs@seed.lk',
    password: 'Seed@12345',
    businessName: 'Hasitha Home Repairs',
    description: 'Plumbing, electrical, tiling, painting and general home maintenance. Reliable same-day response.',
    contactPhone: '+94711000005',
    contactEmail: 'hasitha.repairs@gmail.com',
    addressLine: '7 Pamankada Road',
    city: 'Maharagama',
    district: 'Colombo',
    lat: 6.8469,
    lng: 79.9258,
    categorySlug: 'home-repair',
    services: [
      { title: 'Plumbing Repairs', description: 'Leaks, pipe replacement, cistern repairs, water heater installation. 1-year workmanship warranty.', priceInfo: 'From LKR 1,500', status: ServiceStatus.ACTIVE },
      { title: 'Electrical Wiring & Repairs', description: 'Fuse box faults, new power points, light fitting, fan installation. Licensed electrician.', priceInfo: 'From LKR 2,000', status: ServiceStatus.ACTIVE },
    ],
  },
  {
    email: 'roshan.clinic@seed.lk',
    password: 'Seed@12345',
    businessName: 'Roshan Medical Centre',
    description: 'General practice and specialist consultations. Home visits available within 10 km of Homagama.',
    contactPhone: '+94711000006',
    contactEmail: 'appointments@roshanmedical.lk',
    addressLine: '3 Homagama Junction',
    city: 'Homagama',
    district: 'Colombo',
    lat: 6.8428,
    lng: 79.9163,
    categorySlug: 'medical-consultation',
    services: [
      { title: 'General Practice Consultation', description: 'In-clinic or home-visit GP consultation. Prescriptions and referral letters provided.', priceInfo: 'LKR 1,500 (clinic) / LKR 3,000 (home)', status: ServiceStatus.ACTIVE },
      { title: 'Diabetes Management', description: 'HbA1c monitoring, medication review and diet counselling for type 1 and type 2 patients.', priceInfo: 'LKR 2,000 per visit', status: ServiceStatus.PENDING_VERIFICATION },
    ],
  },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

async function setLocation(profileId: string, lat: number, lng: number) {
  await prisma.$executeRaw`
    UPDATE "ProviderProfile"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${profileId}
  `;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding categories…');
  const categoryMap = new Map<string, string>(); // slug → id

  for (const cat of CATEGORIES) {
    const record = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, vertical: cat.vertical },
      create: { name: cat.name, slug: cat.slug, vertical: cat.vertical },
    });
    categoryMap.set(cat.slug, record.id);
    console.log(`  category: ${record.name} (${record.id})`);
  }

  console.log('\nSeeding providers…');
  for (const prov of PROVIDERS) {
    const passwordHash = await argon2.hash(prov.password);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: prov.email },
      update: { passwordHash },
      create: { email: prov.email, passwordHash, role: 'PROVIDER', status: 'ACTIVE' },
    });

    // Upsert provider profile (no upsert by userId in Prisma, so use findUnique + create/update)
    let profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.providerProfile.create({
        data: {
          userId: user.id,
          businessName: prov.businessName,
          description: prov.description,
          contactPhone: prov.contactPhone,
          contactEmail: prov.contactEmail,
          addressLine: prov.addressLine,
          city: prov.city,
          district: prov.district,
          status: ProviderStatus.VERIFIED,
        },
      });
    } else {
      profile = await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          businessName: prov.businessName,
          description: prov.description,
          contactPhone: prov.contactPhone,
          contactEmail: prov.contactEmail,
          addressLine: prov.addressLine,
          city: prov.city,
          district: prov.district,
          status: ProviderStatus.VERIFIED,
        },
      });
    }

    await setLocation(profile.id, prov.lat, prov.lng);

    // Ensure at least one verification document exists (seeded, not a real file)
    const docCount = await prisma.verificationDocument.count({
      where: { providerProfileId: profile.id },
    });
    if (docCount === 0) {
      await prisma.verificationDocument.create({
        data: {
          providerProfileId: profile.id,
          type: DocumentType.BUSINESS_REG,
          fileUrl: `https://seed.internal/docs/${profile.id}/business_reg.pdf`,
          status: 'APPROVED',
        },
      });
    }

    console.log(`  provider: ${prov.businessName} (${user.email})`);

    // Upsert services
    const categoryId = categoryMap.get(prov.categorySlug)!;
    for (const svc of prov.services) {
      const existing = await prisma.service.findFirst({
        where: { providerProfileId: profile.id, title: svc.title },
      });
      if (existing) {
        await prisma.service.update({
          where: { id: existing.id },
          data: { status: svc.status, description: svc.description, priceInfo: svc.priceInfo },
        });
        console.log(`    service (updated): ${svc.title} [${svc.status}]`);
      } else {
        await prisma.service.create({
          data: {
            providerProfileId: profile.id,
            categoryId,
            title: svc.title,
            description: svc.description,
            priceInfo: svc.priceInfo,
            status: svc.status,
          },
        });
        console.log(`    service (created): ${svc.title} [${svc.status}]`);
      }
    }
  }

  console.log('\nSeed complete.');
  console.log('Admin credentials: set ADMIN_EMAIL + ADMIN_PASSWORD and run `pnpm seed:admin`');
  console.log('Provider credentials: <email> / Seed@12345 (all providers use the same password)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
