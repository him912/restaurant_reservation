/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const INITIAL_RESTAURANTS = [
  {
    id: 'rest-1',
    name: 'Bella Italia Trattoria',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'An intimate, family-owned Venetian sanctuary serving hand-rolled pastas, legacy Roman sauces, and imported Tuscan wines. Surrounded by hand-crafted clay accents and warm bistro illumination.',
    cuisine: 'Italian',
    rating: 4.8,
    ratingCount: 147,
    priceRange: '§§',
    location: 'Downtown Core',
    address: '248 Tuscan Way, Suite 10, Downtown',
    email: 'ciao@bellaitaliatrattoria.com',
    phone: '(555) 124-7890',
    capacity: 48,
    openingHours: '12:00 PM - 10:00 PM',
    features: ['Outdoor Seating', 'Live Accordion Sat', 'Award-winning Wine Cellar', 'Gluten-Free Menu Options'],
    menu: [
      { id: 'm-101', name: 'Truffle Tagliolini', price: 28, category: 'Mains', description: 'Handmade fresh egg pasta, black summer truffle purée, aged Parmigiano-Reggiano, and rich farm butter.', isPopular: true },
      { id: 'm-102', name: 'Focaccia della Casa', price: 8, category: 'Appetizers', description: 'Warm rosemary-infused focaccia served with cold-pressed virgin olive oil and 18-year barrel garlic balsamic.', isPopular: false },
      { id: 'm-103', name: 'Slow-Braised Veal Osso Buco', price: 42, category: 'Mains', description: 'Tender cross-cut veal shank braised with root vegetables and Pinot Grigio, atop creamy saffron risotto.', isPopular: true },
      { id: 'm-104', name: 'Traditional Espresso Tiramisu', price: 12, category: 'Desserts', description: 'Espresso-soaked ladyfingers, whipped mascarpone sabayon, dark cocoa dusting.', isPopular: true },
      { id: 'm-105', name: 'Aperol Spritz Classico', price: 14, category: 'Drinks', description: 'Mionetto Prosecco, Aperol, splash of premium club soda, orange slice, green Castelvetrano olive.', isPopular: false }
    ]
  },
  {
    id: 'rest-2',
    name: 'Sakura Omakase Counter',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'A strictly quiet 12-seat cedar counter offering premium Edo-style sushi curated bite-by-bite. Seafood is fresh-flown from Toyosu Market three times weekly to ensure absolute peak seasonal flavor.',
    cuisine: 'Japanese',
    rating: 4.9,
    ratingCount: 94,
    priceRange: '§§§§',
    location: 'Waterfront District',
    address: '88 Sakura Boulevard, Waterfront',
    email: 'contact@sakuraomakase.com',
    phone: '(555) 765-4321',
    capacity: 12,
    openingHours: '5:30 PM - 11:00 PM',
    features: ['Chef Table Only', 'Pre-Payment Required', 'Sake Flight Pairings', 'Intimate Minimalist Vibe'],
    menu: [
      { id: 'm-201', name: '15-Course Seasonal Omakase', price: 180, category: 'Mains', description: 'Curated direct choice by Sushi Master Kenji, featuring dry-matured Otoro, Uni, and house-cured Ikura.', isPopular: true },
      { id: 'm-202', name: 'Foie Gras & Unagi Gyoza', price: 24, category: 'Appetizers', description: 'Savory dumplings filled with duck liver and fresh water eel, drizzled with sweet kabayaki caramel.', isPopular: true },
      { id: 'm-203', name: 'Yuzu Matcha Panna Cotta', price: 15, category: 'Desserts', description: 'Silky Kyoto match-flavored cream, bright organic yuzu gelatin glaze, white chocolate crisp.', isPopular: false },
      { id: 'm-204', name: 'Dassai 23 Junmai Daiginjo (Glass)', price: 28, category: 'Drinks', description: 'Beautifully polished premium sake with intense floral aromatics and a clean, lingering finish.', isPopular: true }
    ]
  },
  {
    id: 'rest-3',
    name: 'Prime & Oak Steakhouse',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Where industrial brass ironwork meets century-old oak. Featuring USDA Prime cuts, dry-aged on hooks in our custom salt-tile room for 35 to 45 days, seared at an incredible 1200 degrees.',
    cuisine: 'Steakhouse',
    rating: 4.7,
    ratingCount: 218,
    priceRange: '§§§',
    location: 'Financial Center',
    address: '500 Granite Plaza, Level 3, Financial District',
    email: 'info@primeandoak.com',
    phone: '(555) 980-1234',
    capacity: 75,
    openingHours: '4:00 PM - 11:00 PM',
    features: ['Private Dining Rooms', 'Whiskey Sommelier', 'Dry-Aging Cellar Display', 'Valet Parking Available'],
    menu: [
      { id: 'm-301', name: '45-Day Bone-In Ribeye (22oz)', price: 74, category: 'Mains', description: 'In-house dry aged, heavily marbled beef, crusted with volcanic salt and smoked pepper.', isPopular: true },
      { id: 'm-302', name: 'Crispy Pork Belly Lollipops', price: 19, category: 'Appetizers', description: 'Wood-fired heritage pork belly, maple bourbon glaze, pickled green apples.', isPopular: false },
      { id: 'm-303', name: 'Skillet Smoked Gouda Mac & Cheese', price: 14, category: 'Appetizers', description: 'Macaroni baked with aged white cheddar, smoked gouda, and crisp herb breadcrumbs.', isPopular: true },
      { id: 'm-304', name: 'Molten Lava Chocolate Soufflé', price: 16, category: 'Desserts', description: 'Rich Single-Origin Valrhona chocolate, melting hot center, served with Tahitian vanilla bean gelato.', isPopular: true },
      { id: 'm-305', name: 'Smoked Pecan Old Fashioned', price: 18, category: 'Drinks', description: 'High West Bourbon, pecan-infused syrup, Angostura bitters, presented in a cherrywood smoke dome.', isPopular: true }
    ]
  },
  {
    id: 'rest-4',
    name: 'Verde Organica Bistro',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'A plant-forward oasis celebrating locally harvested biodynamic ingredients. Bright, plant-filled solarium dining room. Ideal for adventurous vegans, vegetarians, and raw food enthusiasts.',
    cuisine: 'Vegan / Vegan-Friendly',
    rating: 4.6,
    ratingCount: 82,
    priceRange: '§§',
    location: 'Arts & Design Quarter',
    address: '12 Greenhouse Lane, Arts Quarter',
    email: 'hello@verdeorganicbistro.com',
    phone: '(555) 321-9876',
    capacity: 40,
    openingHours: '11:00 AM - 9:00 PM',
    features: ['Vegan-Only Cooking Stations', '100% Organic Ingredients', 'Pet Friendly Patio', 'Cold-Press Juice Bar'],
    menu: [
      { id: 'm-401', name: 'Charred Heirloom Cauliflower Steak', price: 23, category: 'Mains', description: 'Chimichurri glaze, toasted pine-nut cream, wild black rice pilaf, micro greens.', isPopular: true },
      { id: 'm-402', name: 'Avocado Tartare & Charcoal Crisps', price: 15, category: 'Appetizers', description: 'Ripe avocado cubes, cucumber, capers, mustard seed, served with baked activated charcoal sesame crackers.', isPopular: false },
      { id: 'm-403', name: 'Raw Citrus Hibiscus Cheesecake', price: 11, category: 'Desserts', description: 'Cashew and coconut nectar base, dates and walnuts crust, glazed with blood orange and hibiscus syrup.', isPopular: true },
      { id: 'm-404', name: 'Green Glow Alchemist Elixir', price: 9, category: 'Drinks', description: 'Kale, spinach, celery, green apple, ginger, turmeric, dynamic spirulina shot.', isPopular: false }
    ]
  },
  {
    id: 'rest-5',
    name: 'L’Avenue Parisienne',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1502301197279-65977c48f722?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1525610558991-0bbb8a1bcca8?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Step into a romantic Belle Époque salon in the heart of the city. Classic French cuisine executed with modern techniques, under sparkling brass chandeliers and historic mirrors.',
    cuisine: 'French',
    rating: 4.8,
    ratingCount: 113,
    priceRange: '§§§',
    location: 'Avenue District',
    address: '77 Champs-Élysées Road, Suite A',
    email: 'reservation@lavenueparisienne.com',
    phone: '(555) 438-2309',
    capacity: 50,
    openingHours: '5:00 PM - 11:30 PM',
    features: ['Romantic Dinner Settings', 'Live French Jazz Fri', 'Elegant Dress Code Required', 'Heated Outdoor Sidewalk Tables'],
    menu: [
      { id: 'm-501', name: 'Classic Burgundy Escargot', price: 18, category: 'Appetizers', description: 'Six imported burgundy snails baked in garlic-herb butter, shallots, puff pastry dome.', isPopular: true },
      { id: 'm-502', name: 'Crisp Duck Confit & Cassoulet', price: 38, category: 'Mains', description: 'Slow-cooked Moulard duck leg with crispy skin, resting on rich white bean stew with garlic sausage.', isPopular: true },
      { id: 'm-503', name: 'Grand Marnier Orange Soufflé', price: 14, category: 'Desserts', description: 'Baked-to-order light-as-air orange liqueur soufflé, dynamic Grand Marnier custard poured tableside.', isPopular: true },
      { id: 'm-504', name: 'Chassagne-Montrachet Chardonnay', price: 24, category: 'Drinks', description: 'An elegant glass of Burgundy white, offering delicate white peach and toasted hazelnut notes.', isPopular: false }
    ]
  },
  {
    id: 'rest-6',
    name: 'The Sichuan Red Lotus',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'An explosive, spice-infused journey showcasing authentic Sichuan cuisine. From numbing peppercorns to intensely simmering firepots, we deliver authentic gourmet fire to true heat lovers.',
    cuisine: 'Chinese',
    rating: 4.5,
    ratingCount: 189,
    priceRange: '§§',
    location: 'Chinatown',
    address: '900 Ginger Alley, Chinatown',
    email: 'info@sichuanredlotus.com',
    phone: '(555) 832-7312',
    capacity: 90,
    openingHours: '11:30 AM - 10:00 PM',
    features: ['Lazy Susans Available', 'BYOB Corkage (Wine Only)', 'Extremely Spicy Challenge Menu', 'Family Feast Packages'],
    menu: [
      { id: 'm-601', name: 'Sichuan Mapo Tofu (Pork or Vegan)', price: 19, category: 'Mains', description: 'Soft tofu cubes in red chili-bean oil broth with numbing Sichuan pepper.', isPopular: true },
      { id: 'm-602', name: 'Mouthwater Numbing Chili Chicken', price: 16, category: 'Appetizers', description: 'Cold poached tender chicken strips steeped in roasted peanut red oil and toasted sesame paste.', isPopular: true },
      { id: 'm-603', name: 'Spicy Firepot Dan Dan Noodles', price: 12, category: 'Appetizers', description: 'Fresh wheat noodles with savory minced soy pork, crushed chili oil, dynamic preserved mustard roots.', isPopular: true },
      { id: 'm-604', name: 'Sweet Fermented Rice Soup Bowls', price: 8, category: 'Desserts', description: 'Warm jasmine-scented sweet soup with miniature filled glutinous rice tangyuan spheres.', isPopular: false }
    ]
  }
];

export const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    restaurantId: 'rest-1',
    reviewerName: 'Marcus Sterling',
    reviewerEmail: 'marcus@sterling.co',
    rating: 5,
    title: 'The Truffle Tagliolini is high magic!',
    content: 'We celebrated our 5th anniversary here last weekend. The live accordion player was a beautiful acoustic touch. The staff knows how to treat people - and that Truffle pasta will haunt my dreams forever.',
    date: '2026-06-01'
  },
  {
    id: 'rev-2',
    restaurantId: 'rest-1',
    reviewerName: 'Elena Rostova',
    reviewerEmail: 'elena.rostov@decor.net',
    rating: 4,
    title: 'Lovely ambiance and flawless service',
    content: 'Very warm, comfortable setting. Service was exceptionally prompt and friendly. Food was tasty, especially the Focaccia, though the Osso Buco was just a tad oversalted. Will definitely returns with friends.',
    date: '2026-06-05'
  },
  {
    id: 'rev-3',
    restaurantId: 'rest-2',
    reviewerName: 'Hiroshi T.',
    reviewerEmail: 'hiroshi@tech-tokyo.jp',
    rating: 5,
    title: 'Flawless Edo-Style Masterpieces',
    content: 'True cedar counter experience. Master Kenji is an artist who treats every single grain of rice with absolute respect. The aged Otoro literally melted on impact immediately. Pure quiet luxury.',
    date: '2026-05-28'
  },
  {
    id: 'rev-4',
    restaurantId: 'rest-3',
    reviewerName: 'Charlotte Hughes',
    reviewerEmail: 'charlotte.hughes@wealth.org',
    rating: 4,
    title: 'Perfect steaks, quite noisy on Thursday',
    content: 'The 45-day bone-in ribeye is arguably the best cut in this district, perfectly seared and seasoned. The whiskey selection is spectacular! Just be warned, it gets quite loud here in the evenings.',
    date: '2026-06-03'
  },
  {
    id: 'rev-5',
    restaurantId: 'rest-4',
    reviewerName: 'Devon Green',
    reviewerEmail: 'devon@greenbistro.co',
    rating: 5,
    title: 'A triumph of plant-based culinary craftsmanship!',
    content: 'The cauliflower steak combines texture, smoky flavor, and acidic chimichurri in a way that rivals any traditional steakhouse. Solarium interior is dynamic and filled with fresh oxygen.',
    date: '2026-06-09'
  }
];

export const INITIAL_RESERVATIONS = [
  {
    id: 'res-t101',
    restaurantId: 'rest-1',
    restaurantName: 'Bella Italia Trattoria',
    restaurantCuisine: 'Italian',
    restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus@sterling.co',
    customerPhone: '(555) 111-2222',
    date: '2026-06-01',
    time: '7:30 PM',
    guests: 2,
    status: 'confirmed',
    specialRequests: 'Anniversary celebration. Quiet table away from entrance if possible.',
    createdAt: '2026-05-20T14:32:00Z',
    tableNumber: 4
  },
  {
    id: 'res-t102',
    restaurantId: 'rest-3',
    restaurantName: 'Prime & Oak Steakhouse',
    restaurantCuisine: 'Steakhouse',
    restaurantImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus@sterling.co',
    customerPhone: '(555) 111-2222',
    date: '2026-06-25',
    time: '8:00 PM',
    guests: 4,
    status: 'pending',
    specialRequests: 'Client dining. Will require a quiet booth.',
    createdAt: '2026-06-10T09:12:00Z'
  },
  {
    id: 'res-t103',
    restaurantId: 'rest-2',
    restaurantName: 'Sakura Omakase Counter',
    restaurantCuisine: 'Japanese',
    restaurantImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus@sterling.co',
    customerPhone: '(555) 111-2222',
    date: '2026-05-15',
    time: '6:00 PM',
    guests: 1,
    status: 'confirmed',
    createdAt: '2026-05-02T11:00:00Z',
    tableNumber: 12
  }
];
