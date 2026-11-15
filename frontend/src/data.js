export const TOWERS = Array.from({ length: 10 }, (_, i) => `SUN ${i + 1}`);
export const WA_NUMBER = '919729099722';
export const STAFF_USER = '123';
export const STAFF_PASS = '123';
export const STAGES = ['Order Accepted', 'Cooking in Kitchen', 'Out for Delivery', 'Delivered'];
export const CUTOFFS = ['8:30 PM', '8:45 PM', '9:00 PM'];
export const SLOTS = ['Instant Fast-Food (30 mins)', '7:30 PM - 8:00 PM', '8:00 PM - 8:30 PM', '8:30 PM - 9:00 PM', '9:00 PM - 9:30 PM'];
export const ADDONS = [
  { id: 'cheese', label: 'Extra Cheese', price: 19 },
  { id: 'butter', label: 'Extra Amul Butter', price: 15 },
  { id: 'spicy', label: 'Make it Extra Spicy / Chatpata', price: 0 },
  { id: 'mild', label: 'Less Spicy - Kid Friendly', price: 0 },
  { id: 'nooniongarlic', label: 'No Onion / No Garlic Prep', price: 0 }
];
export const SABZIS = ['Aloo Gobhi Adraki Masala', 'Kadhai Paneer Masala', 'Mix Veg Dhaba Style', 'Bhindi Do Pyaza', 'Matar Paneer Homestyle', 'Aloo Matar Tamatar Rasedar'];
export const PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=80'
];
export const CATEGORIES = ['Meal For 1', 'Burgers', 'Noodles & Maggie', 'Pasta', 'Fries & Crisps', 'Eggs & Omelettes', 'The Bread Basket', 'Extras'];

export const THALIS0 = [
  { id: 'thali-roti-sabzi', title: 'Homestyle Sabzi + 4 Roti + Dal Fry + Rice Thali', base: '4 Butter Tawa Roti + Dal Fry + Steamed Rice + Fresh Salad', sabzi: 'Aloo Gobhi Adraki Masala', price: 139, total: 40, left: 18, rotis: 4, puris: 0, badge: "Tonight's Rotating Sabzi Meal", img: PHOTO_PRESETS[0], active: true },
  { id: 'thali-puri-chole', title: 'Punjabi Chole + Rice + 5 Hot Puri + Salad Meal', base: 'Pindi Chole + Steamed Rice + 5 Hot Fluffy Puris + Pickled Onion Salad', sabzi: null, price: 139, total: 35, left: 14, rotis: 0, puris: 5, badge: 'Daily Dinner Special', img: PHOTO_PRESETS[1], active: true }
];

// [id, category, name, price, veg, desc]
const M = [
  ['mk-combo-1', 'Meal For 1', 'Aaloo Patty Burger + Salted Fries + Coke', 149, 1, 'Perfect for one: burger, fries and a chilled Coke.'],
  ['mk-burg-1', 'Burgers', 'Aaloo Patty Burger', 69, 1, 'Crispy spiced potato patty in a toasted bun.'],
  ['mk-burg-2', 'Burgers', 'Aaloo Patty Cheese Burger', 79, 1, 'Aaloo patty with a melted cheese slice.'],
  ['mk-burg-3', 'Burgers', 'Aaloo Patty Nacho & Cheese Burger', 89, 1, 'Loaded with crunchy nachos and cheese.'],
  ['mk-burg-4', 'Burgers', 'Extra Cheese', 19, 1, 'Extra cheese slice add-on.'],
  ['mk-mag-1', 'Noodles & Maggie', 'Plain Maggie', 49, 1, 'Classic masala Maggie.'],
  ['mk-mag-2', 'Noodles & Maggie', 'Vegetables Maggie', 59, 1, 'With carrots, capsicum, peas and onions.'],
  ['mk-mag-3', 'Noodles & Maggie', 'Plain Amul Butter Maggie', 69, 1, 'Finished with Amul butter.'],
  ['mk-mag-4', 'Noodles & Maggie', 'Vegetables Butter Maggie', 79, 1, 'Veggies sautéed in Amul butter.'],
  ['mk-mag-5', 'Noodles & Maggie', 'Plain Cheese Maggie', 79, 1, 'Topped with melted cheese.'],
  ['mk-mag-6', 'Noodles & Maggie', 'Butter & Cheese Vegetable Maggie', 99, 1, 'Veggies, Amul butter and cheese.'],
  ['mk-pas-1', 'Pasta', 'Macroni Homestyle', 129, 1, 'Desi masala homestyle macaroni.'],
  ['mk-pas-2', 'Pasta', 'Creamy Arrabiata Pasta', 149, 1, 'Zesty red tomato and cream sauce.'],
  ['mk-pas-3', 'Pasta', 'Fettuccine Alfredo Pasta', 159, 1, 'Velvety white cheese garlic sauce.'],
  ['mk-pas-4', 'Pasta', 'Alfredo Spaghetti', 179, 1, 'Spaghetti in creamy Alfredo sauce.'],
  ['mk-pas-5', 'Pasta', 'Mac And Cheese', 159, 1, 'Elbow macaroni in double-cheese sauce.'],
  ['mk-fri-1', 'Fries & Crisps', 'Peri-Peri Fries', 89, 1, 'Spicy, tangy peri-peri seasoning.'],
  ['mk-fri-2', 'Fries & Crisps', 'Salted Potato Fries', 89, 1, 'Classic golden salted fries.'],
  ['mk-fri-3', 'Fries & Crisps', 'Peri-Peri Cheesy Potato Fries', 109, 1, 'Peri-peri fries with warm liquid cheese.'],
  ['mk-egg-1', 'Eggs & Omelettes', '1 Egg Amul Butter Omelette', 39, 0, 'Single-egg masala omelette in Amul butter.'],
  ['mk-egg-2', 'Eggs & Omelettes', '2 Eggs Amul Butter Omelette', 49, 0, 'Fluffy 2-egg omelette in Amul butter.'],
  ['mk-egg-3', 'Eggs & Omelettes', '2 Eggs Bread Butter Omelette', 69, 0, '2-egg omelette with toasted butter bread.'],
  ['mk-egg-4', 'Eggs & Omelettes', 'Egg Bhurji (2 Eggs)', 79, 0, 'Spiced scrambled eggs in Amul butter.'],
  ['mk-brd-1', 'The Bread Basket', 'Spiced Potato Toastie (4 pieces)', 59, 1, 'Grilled spiced potato sandwich, 4 pieces.'],
  ['mk-brd-2', 'The Bread Basket', 'Potato Cheese Toast (4 pieces)', 79, 1, 'Aloo masala and melted cheese toast, 4 pieces.'],
  ['mk-brd-3', 'The Bread Basket', 'Vegetable Cheese Toastie (4 pieces)', 99, 1, 'Corn, capsicum, onion and cheese, 4 pieces.'],
  ['mk-ext-1', 'Extras', 'Coke', 20, 1, 'Chilled Coca-Cola.'],
  ['mk-ext-2', 'Extras', 'Fanta', 20, 1, 'Chilled orange Fanta.'],
  ['mk-ext-3', 'Extras', 'Thums Up', 20, 1, 'Chilled Thums Up.']
];
export const MENU0 = M.map(([id, category, name, price, veg, desc]) => ({ id, category, name, price, veg: !!veg, desc, inStock: true }));
