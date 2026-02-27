const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Fruit = require('../models/Fruit');
const Voucher = require('../models/Voucher');

const BASE = 'https://images.unsplash.com';
const Q = '?w=800&q=80&auto=format&fit=crop';

// ─── Demo Farmer Profiles ────────────────────────────────────────────────────
// Edit these objects to update each farmer's story, images, and farm details.
// Changes take effect on the next server restart (profiles are always upserted).
//
// Image array positions (fixed layout used by FarmerProfilePage):
//   index 0  →  Hero / banner image  (large full-width background photo)
//   index 1  →  Gallery photo 1      (shown in "From Our Farm" horizontal strip)
//   index 2  →  Gallery photo 2
//   index 3  →  Gallery photo 3
//   index 4  →  Gallery photo 4
//
// Login credentials for demo farmers: email below / password "Demo@1234"
// ─────────────────────────────────────────────────────────────────────────────

const FARMER_PROFILES = [

  // ── Farmer 1: Green Valley Farm ────────────────────────────────────────────
  {
    _id: 'demo-farmer-1',
    name: 'Green Valley Farm',
    email: 'greenvalley@demo.com',
    password: 'Demo@1234',
    role: 'farmer',
    location: 'California, USA',
    phone: '+1-530-555-0101',

    farmName: 'Green Valley Farm',
    farmTagline: 'Certified organic fruit from our century-old California orchard',
    farmStory:
`Nestled in the rolling hills of Northern California, Green Valley Farm has been growing premium organic fruit since 1952. Founded by Harold Bennett and now run by his grandchildren, we've spent over seven decades nurturing our land the right way — without shortcuts, chemicals, or compromise.

Our apple and citrus trees grow in rich, volcanic soil fed by natural springs. Every piece of fruit is hand-picked by our small team of local workers who take pride in selecting only the finest produce for you.

We believe that what's good for the soil is good for you. That's why we've held USDA Organic certification for over 30 years and still follow the same farming practices Harold taught us: compost everything, rotate crops, and never rush the harvest.

When you buy from Green Valley Farm, you're not just buying fruit — you're supporting three generations of family farming and a piece of California's living agricultural heritage.`,

    farmImages: [
      `${BASE}/photo-1567306226416-28f0efdc88ce${Q}`,  // [0] HERO: red apples on tree
      `${BASE}/photo-1528750717929-32abb73d3bd9${Q}`,  // [1] apple orchard rows
      `${BASE}/photo-1560493676-04071c5f467b${Q}`,     // [2] hand-picking apples
      `${BASE}/photo-1500595046743-cd271d694d30${Q}`,  // [3] farmhouse & barn
      `${BASE}/photo-1416879595882-3373a0480b5b${Q}`,  // [4] green countryside field
    ],

    farmingPractices: [
      'Certified Organic',
      'No Pesticides',
      'Rainwater Harvesting',
      'Composting',
      'Hand-Picked Harvest',
    ],

    certifications: [
      'USDA Organic',
      'CCOF Certified',
      'Non-GMO Verified',
    ],

    establishedYear: 1952,
    farmSizeAcres: 45,
  },

  // ── Farmer 2: Sunshine Orchards ────────────────────────────────────────────
  {
    _id: 'demo-farmer-2',
    name: 'Sunshine Orchards',
    email: 'sunshine@demo.com',
    password: 'Demo@1234',
    role: 'farmer',
    location: 'Maharashtra, India',
    phone: '+91-98765-43210',

    farmName: 'Sunshine Orchards',
    farmTagline: 'Tropical flavours grown with love under the Maharashtra sun',
    farmStory:
`In the Konkan belt of Maharashtra — where the Arabian Sea breeze meets the Western Ghats — our family has grown the legendary Alphonso mango for four generations. Sunshine Orchards was officially established in 1985 by our grandfather, Ramabai Desai, on 30 acres of fertile red laterite soil that has been in our family for over a century.

The Alphonso, known as the "King of Mangoes," only thrives in this precise microclimate. The combination of coastal air, mineral-rich soil, and traditional farming methods gives our mangoes a flavour and aroma that no other region can replicate. Every year, families across India and abroad wait eagerly for our summer harvest.

Beyond mangoes, we grow bananas and source the finest tropical fruits from partner farms that share our commitment to quality. We personally inspect every fruit before it reaches you.

Natural farming is not just a practice for us — it is a way of life passed down through generations. No synthetic chemicals touch our land. The earth takes care of us, and we take care of the earth.`,

    farmImages: [
      `${BASE}/photo-1601493700631-2b16ec4b4716${Q}`,  // [0] HERO: ripe Alphonso mangoes
      `${BASE}/photo-1560806887-1e4cd0b6cbd6${Q}`,     // [1] mango tree in orchard
      `${BASE}/photo-1571771894821-ce9b6c11b08e${Q}`,  // [2] bananas on tree
      `${BASE}/photo-1550258987-190a2d41a8ba${Q}`,     // [3] golden pineapple
      `${BASE}/photo-1596040033229-a9821ebd058d${Q}`,  // [4] tropical fruit basket
    ],

    farmingPractices: [
      'Natural Farming',
      'No Chemical Fertilizers',
      'Traditional Methods',
      'Intercropping',
      'Seasonal Harvesting',
    ],

    certifications: [
      'India Organic (APEDA)',
      'PGS-India Certified',
      'GI Tag — Alphonso Mango',
    ],

    establishedYear: 1985,
    farmSizeAcres: 30,
  },

  // ── Farmer 3: Berry Good Farm ──────────────────────────────────────────────
  {
    _id: 'demo-farmer-3',
    name: 'Berry Good Farm',
    email: 'berrygood@demo.com',
    password: 'Demo@1234',
    role: 'farmer',
    location: 'Oregon, USA',
    phone: '+1-503-555-0177',

    farmName: 'Berry Good Farm',
    farmTagline: 'Sun-kissed Oregon berries and grapes, grown with sustainable love',
    farmStory:
`Berry Good Farm started in 1998 when sisters Maya and Clara Okon bought 20 acres in the Willamette Valley and planted their first strawberry beds on a warm spring morning. Neither of them had farmed before — what they had was a deep love of good food, a stubborn belief in sustainable agriculture, and very sore hands after that first planting season.

Twenty-five years later, our strawberries and red grapes have found their way into kitchens, restaurants, and hearts across the Pacific Northwest. The Willamette Valley's cool nights and warm days create a perfect growing season — the kind of climate that coaxes natural sugars into every berry without artificial ripening agents.

We practice Integrated Pest Management, meaning we work with nature rather than against it. Beneficial insects, cover crops, and careful water management keep our soil healthy and our produce clean. We've been SCS certified sustainable since 2008.

Every box that leaves our farm is hand-sorted by us or our small, permanent team. We don't use picking machines — human hands are gentler, and we want you to receive fruit that looks and tastes exactly as if you picked it yourself.`,

    farmImages: [
      `${BASE}/photo-1464965911861-746a04b4bca6${Q}`,  // [0] HERO: strawberry field
      `${BASE}/photo-1506377247377-2a5b3b417ebb${Q}`,  // [1] vineyard rows at sunset
      `${BASE}/photo-1537640538966-79f369143f8f${Q}`,  // [2] red grapes closeup
      `${BASE}/photo-1543353071-10c8ba85a904${Q}`,     // [3] berry picking by hand
      `${BASE}/photo-1504754524776-8f4f37790ca0${Q}`,  // [4] farm landscape & fields
    ],

    farmingPractices: [
      'Sustainable Farming',
      'Integrated Pest Management',
      'Hand-Picked Harvest',
      'Cover Cropping',
      'Water Conservation',
    ],

    certifications: [
      'SCS Certified Sustainable',
      'Oregon Tilth Organic',
      'Salmon-Safe Certified',
    ],

    establishedYear: 1998,
    farmSizeAcres: 20,
  },

];

// ─── Product Listings ─────────────────────────────────────────────────────────

const seedFruits = [
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-1',
    farmerName: 'Green Valley Farm',
    name: 'Organic Apples',
    description:
`Grown in the mineral-rich volcanic soil of California's rolling hills, our Organic Apples are hand-picked at peak ripeness — never rushed, never machine-harvested.

🍎 Crisp & Flavourful
Our Fuji-Gala blend delivers a satisfying crunch and perfectly balanced sweetness. The volcanic soil imparts a depth of flavour you simply won't find in supermarket apples.

🌿 Certified Organic Since 1993
No synthetic pesticides, herbicides or fertilizers have touched our orchard in over 30 years. We rely on compost, cover crops and natural predator insects to keep our trees thriving.

📦 Packed Within 24 Hours of Harvest
Shipped directly from our farm to your door — no extended cold storage, no waxing, no compromise on freshness.`,
    price: 2.50, unit: 'kg', quantity: 150, location: 'California, USA', category: 'Apple',
    transportCostPerUnit: 0.50,
    images: [
      `${BASE}/photo-1570913149827-d2ac84ab3f9a${Q}`,  // [0] red apples closeup
      `${BASE}/photo-1568702846914-96b305d2aaeb${Q}`,  // [1] sliced apple
      `${BASE}/photo-1506905925346-21bda4d32df4${Q}`,  // [2] green apples in bowl
      `${BASE}/photo-1471585620403-52fc31d6bebb${Q}`,  // [3] apples in basket
      `${BASE}/photo-1459171486003-74efa6eba9c1${Q}`,  // [4] fresh apples pile
    ],
    videos: [
      'https://www.youtube.com/watch?v=jNQXAC9IVRw',  // placeholder video 1 — replace with actual farm footage
      'https://www.youtube.com/watch?v=9bZkp7q19f0',  // placeholder video 2 — replace with harvest/orchard tour
    ],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-2',
    farmerName: 'Sunshine Orchards',
    name: 'Alphonso Mangoes',
    description: 'Premium Alphonso mangoes — the king of mangoes. Sweet, rich and aromatic.',
    price: 5.00, unit: 'kg', quantity: 80, location: 'Maharashtra, India', category: 'Mango',
    transportCostPerUnit: 1.00,
    images: [`${BASE}/photo-1601493700631-2b16ec4b4716${Q}`, `${BASE}/photo-1591073113125-e46713c829ed${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-1',
    farmerName: 'Green Valley Farm',
    name: 'Valencia Oranges',
    description: 'Juicy Valencia oranges, perfect for fresh juice. Naturally sweet and full of Vitamin C.',
    price: 1.80, unit: 'kg', quantity: 200, location: 'California, USA', category: 'Orange',
    transportCostPerUnit: 0.75,
    images: [`${BASE}/photo-1611080626919-7cf5a9dbab12${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-3',
    farmerName: 'Berry Good Farm',
    name: 'Fresh Strawberries',
    description: 'Sweet, plump strawberries picked at peak ripeness. Great for desserts and smoothies.',
    price: 4.00, unit: 'kg', quantity: 60, location: 'Oregon, USA', category: 'Berry',
    transportCostPerUnit: 1.50,
    images: [`${BASE}/photo-1464965911861-746a04b4bca6${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-2',
    farmerName: 'Sunshine Orchards',
    name: 'Cavendish Bananas',
    description: 'Ripe, naturally sweet bananas. Great for smoothies, baking or a quick snack.',
    price: 1.20, unit: 'kg', quantity: 300, location: 'Ecuador', category: 'Banana',
    transportCostPerUnit: 0.25,
    images: [`${BASE}/photo-1571771894821-ce9b6c11b08e${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-3',
    farmerName: 'Berry Good Farm',
    name: 'Seedless Red Grapes',
    description: 'Crunchy and sweet seedless red grapes. Perfect for snacking or wine-making.',
    price: 3.50, unit: 'kg', quantity: 90, location: 'Napa Valley, USA', category: 'Grapes',
    transportCostPerUnit: 1.00,
    images: [`${BASE}/photo-1537640538966-79f369143f8f${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-1',
    farmerName: 'Green Valley Farm',
    name: 'Meyer Lemons',
    description: 'Sweet Meyer lemons with thin skin. Great for lemonade, cooking, and baking.',
    price: 2.00, unit: 'kg', quantity: 120, location: 'California, USA', category: 'Lemon',
    transportCostPerUnit: 0.50,
    images: [`${BASE}/photo-1590502593747-42a996133562${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-2',
    farmerName: 'Sunshine Orchards',
    name: 'Golden Pineapples',
    description: 'Sun-ripened golden pineapples with intense tropical sweetness.',
    price: 3.00, unit: 'piece', quantity: 50, location: 'Costa Rica', category: 'Pineapple',
    transportCostPerUnit: 0.80,
    images: [`${BASE}/photo-1550258987-190a2d41a8ba${Q}`],
  },
];

// ─── Vouchers ─────────────────────────────────────────────────────────────────

const seedVouchers = [
  {
    _id: uuidv4(), code: 'FRESH10', type: 'percentage', value: 10,
    minOrderAmount: 0, maxUses: 100, usedCount: 0, expiresAt: '2027-12-31T23:59:59Z', isActive: true,
  },
  {
    _id: uuidv4(), code: 'FARM20', type: 'percentage', value: 20,
    minOrderAmount: 20, maxUses: 50, usedCount: 0, expiresAt: '2027-12-31T23:59:59Z', isActive: true,
  },
  {
    _id: uuidv4(), code: 'SAVE5', type: 'fixed', value: 5,
    minOrderAmount: 10, maxUses: 0, usedCount: 0, expiresAt: null, isActive: true,
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────

module.exports = async function seed() {
  // Upsert demo farmer accounts.
  // Account credentials ($set) are refreshed on every restart.
  // Farm story/profile fields ($setOnInsert) are only written on first create
  // so that any edits saved by the farmer through the dashboard are preserved.
  const pw = await bcrypt.hash('Demo@1234', 10);
  for (const profile of FARMER_PROFILES) {
    const {
      password, // eslint-disable-line no-unused-vars
      farmName, farmTagline, farmStory, farmImages,
      farmingPractices, certifications, establishedYear, farmSizeAcres,
      ...accountFields
    } = profile;

    await User.findByIdAndUpdate(
      profile._id,
      {
        $set: { ...accountFields, password: pw },       // always keep credentials current
        $setOnInsert: {                                  // only seed profile data once
          farmName, farmTagline, farmStory, farmImages,
          farmingPractices, certifications, establishedYear, farmSizeAcres,
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log('✓ Seeded/updated demo farmer profiles');

  const fruitCount = await Fruit.countDocuments();
  if (fruitCount === 0) {
    await Fruit.insertMany(seedFruits);
    console.log('✓ Seeded fruits');
  }

  // Always keep demo product content fresh (description, images, videos)
  const appleDemo = seedFruits[0]; // Organic Apples
  await Fruit.findOneAndUpdate(
    { farmerId: 'demo-farmer-1', name: 'Organic Apples' },
    { $set: { description: appleDemo.description, images: appleDemo.images, videos: appleDemo.videos } },
  );

  const voucherCount = await Voucher.countDocuments();
  if (voucherCount === 0) {
    await Voucher.insertMany(seedVouchers);
    console.log('✓ Seeded vouchers');
  }
};
