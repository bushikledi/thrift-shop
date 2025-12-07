import 'dotenv/config';
import {
  PrismaClient,
  UserRole,
  ProductCondition,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  MediaOwnerType,
} from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Helper to generate slugs
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper to get random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate order number
function generateOrderNumber(index: number): string {
  const year = new Date().getFullYear();
  return `TS-${year}-${String(index).padStart(4, '0')}`;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cartSession.deleteMany();
  await prisma.media.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();

  // Create password hash for all users (password: "password123")
  const passwordHash = await bcrypt.hash('password123', 12);

  // =============================================================================
  // USERS
  // =============================================================================
  console.log('👤 Creating users...');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@thriftshop.com',
      passwordHash,
      name: 'Admin User',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      address: {
        street: '123 Admin Street',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
      },
    },
  });

  // Customer users
  const customerData = [
    { email: 'john.doe@email.com', name: 'John Doe', phone: '+1555123001' },
    { email: 'jane.smith@email.com', name: 'Jane Smith', phone: '+1555123002' },
    {
      email: 'mike.johnson@email.com',
      name: 'Mike Johnson',
      phone: '+1555123003',
    },
    {
      email: 'sarah.williams@email.com',
      name: 'Sarah Williams',
      phone: '+1555123004',
    },
    {
      email: 'david.brown@email.com',
      name: 'David Brown',
      phone: '+1555123005',
    },
    {
      email: 'emily.davis@email.com',
      name: 'Emily Davis',
      phone: '+1555123006',
    },
    {
      email: 'chris.wilson@email.com',
      name: 'Chris Wilson',
      phone: '+1555123007',
    },
    {
      email: 'amanda.moore@email.com',
      name: 'Amanda Moore',
      phone: '+1555123008',
    },
    {
      email: 'ryan.taylor@email.com',
      name: 'Ryan Taylor',
      phone: '+1555123009',
    },
    {
      email: 'melissa.anderson@email.com',
      name: 'Melissa Anderson',
      phone: '+1555123010',
    },
    {
      email: 'kevin.thomas@email.com',
      name: 'Kevin Thomas',
      phone: '+1555123011',
    },
    {
      email: 'jessica.jackson@email.com',
      name: 'Jessica Jackson',
      phone: '+1555123012',
    },
    {
      email: 'brian.white@email.com',
      name: 'Brian White',
      phone: '+1555123013',
    },
    {
      email: 'lauren.harris@email.com',
      name: 'Lauren Harris',
      phone: '+1555123014',
    },
    {
      email: 'matthew.martin@email.com',
      name: 'Matthew Martin',
      phone: '+1555123015',
    },
  ];

  const customers = await Promise.all(
    customerData.map((data, index) =>
      prisma.user.create({
        data: {
          ...data,
          passwordHash,
          role: UserRole.CUSTOMER,
          isActive: true,
          emailVerified: index < 10, // First 10 are verified
          address: {
            street: `${100 + index} Customer Ave`,
            city: randomElement([
              'New York',
              'Los Angeles',
              'Chicago',
              'Houston',
              'Phoenix',
            ]),
            state: randomElement(['NY', 'CA', 'IL', 'TX', 'AZ']),
            zip: `${10000 + index * 100}`,
            country: 'USA',
          },
        },
      }),
    ),
  );

  // Vendor users
  const vendorUserData = [
    {
      email: 'vintage.vibes@email.com',
      name: 'Vintage Vibes Owner',
      displayName: 'Vintage Vibes',
      bio: 'Curating the finest vintage clothing from the 60s to 90s. Every piece tells a story.',
    },
    {
      email: 'retro.finds@email.com',
      name: 'Retro Finds Owner',
      displayName: 'Retro Finds',
      bio: 'Your one-stop shop for authentic retro fashion and collectibles.',
    },
    {
      email: 'eco.threads@email.com',
      name: 'Eco Threads Owner',
      displayName: 'Eco Threads',
      bio: 'Sustainable fashion for the conscious consumer. Pre-loved, pre-beautiful.',
    },
    {
      email: 'urban.renewal@email.com',
      name: 'Urban Renewal Owner',
      displayName: 'Urban Renewal',
      bio: 'Street style meets sustainability. Fresh finds, fresh style.',
    },
    {
      email: 'timeless.treasures@email.com',
      name: 'Timeless Treasures Owner',
      displayName: 'Timeless Treasures',
      bio: 'Discover timeless pieces that never go out of style.',
    },
    {
      email: 'boho.bazaar@email.com',
      name: 'Boho Bazaar Owner',
      displayName: 'Boho Bazaar',
      bio: 'Free-spirited fashion for the modern bohemian.',
    },
    {
      email: 'classic.closet@email.com',
      name: 'Classic Closet Owner',
      displayName: 'Classic Closet',
      bio: 'Classic styles, modern prices. Quality second-hand fashion.',
    },
    {
      email: 'thrift.luxe@email.com',
      name: 'Thrift Luxe Owner',
      displayName: 'Thrift Luxe',
      bio: 'Luxury brands at thrift prices. Designer finds for less.',
    },
    {
      email: 'green.wardrobe@email.com',
      name: 'Green Wardrobe Owner',
      displayName: 'Green Wardrobe',
      bio: 'Fashion that cares for the planet. Every purchase plants a tree.',
    },
    {
      email: 'second.chance@email.com',
      name: 'Second Chance Owner',
      displayName: 'Second Chance Style',
      bio: 'Giving clothes a second life, one piece at a time.',
    },
  ];

  const vendorUsers = await Promise.all(
    vendorUserData.map((data, index) =>
      prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          phone: `+1555200${String(index).padStart(3, '0')}`,
          role: UserRole.VENDOR,
          isActive: true,
          emailVerified: true,
          address: {
            street: `${200 + index} Vendor Blvd`,
            city: randomElement([
              'Brooklyn',
              'San Francisco',
              'Austin',
              'Portland',
              'Seattle',
            ]),
            state: randomElement(['NY', 'CA', 'TX', 'OR', 'WA']),
            zip: `${20000 + index * 100}`,
            country: 'USA',
          },
          vendor: {
            create: {
              name: generateSlug(data.displayName),
              displayName: data.displayName,
              bio: data.bio,
              verified: index < 7, // First 7 vendors are verified
              rating: 3.5 + Math.random() * 1.5, // Rating between 3.5 and 5
              reviewCount: randomBetween(10, 150),
            },
          },
        },
        include: { vendor: true },
      }),
    ),
  );

  const vendors = vendorUsers.map((u) => u.vendor!);

  // =============================================================================
  // CATEGORIES
  // =============================================================================
  console.log('📁 Creating categories...');

  // Main categories
  const mainCategories = await Promise.all([
    prisma.category.create({
      data: {
        slug: 'womens-clothing',
        name: "Women's Clothing",
        description: 'Second-hand clothing for women',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'mens-clothing',
        name: "Men's Clothing",
        description: 'Second-hand clothing for men',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'kids-clothing',
        name: "Kids' Clothing",
        description: 'Second-hand clothing for children',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'accessories',
        name: 'Accessories',
        description: 'Bags, jewelry, hats, and more',
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'shoes',
        name: 'Shoes',
        description: 'Pre-owned footwear',
        sortOrder: 5,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'home-goods',
        name: 'Home Goods',
        description: 'Second-hand home items and decor',
        sortOrder: 6,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'vintage',
        name: 'Vintage',
        description: 'Authentic vintage items from past decades',
        sortOrder: 7,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'designer',
        name: 'Designer',
        description: 'Pre-owned designer and luxury items',
        sortOrder: 8,
        isActive: true,
      },
    }),
  ]);

  // Subcategories
  const [
    womensClothing,
    mensClothing,
    kidsClothing,
    accessories,
    shoes,
    homeGoods,
    vintage,
    designer,
  ] = mainCategories;

  const subcategories = await Promise.all([
    // Women's subcategories
    prisma.category.create({
      data: {
        slug: 'womens-dresses',
        name: 'Dresses',
        parentId: womensClothing.id,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'womens-tops',
        name: 'Tops & Blouses',
        parentId: womensClothing.id,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'womens-bottoms',
        name: 'Pants & Skirts',
        parentId: womensClothing.id,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'womens-outerwear',
        name: 'Jackets & Coats',
        parentId: womensClothing.id,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'womens-activewear',
        name: 'Activewear',
        parentId: womensClothing.id,
        sortOrder: 5,
      },
    }),

    // Men's subcategories
    prisma.category.create({
      data: {
        slug: 'mens-shirts',
        name: 'Shirts',
        parentId: mensClothing.id,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'mens-pants',
        name: 'Pants',
        parentId: mensClothing.id,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'mens-outerwear',
        name: 'Jackets & Coats',
        parentId: mensClothing.id,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'mens-suits',
        name: 'Suits & Blazers',
        parentId: mensClothing.id,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'mens-activewear',
        name: 'Activewear',
        parentId: mensClothing.id,
        sortOrder: 5,
      },
    }),

    // Kids' subcategories
    prisma.category.create({
      data: {
        slug: 'kids-boys',
        name: 'Boys',
        parentId: kidsClothing.id,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'kids-girls',
        name: 'Girls',
        parentId: kidsClothing.id,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'kids-baby',
        name: 'Baby',
        parentId: kidsClothing.id,
        sortOrder: 3,
      },
    }),

    // Accessories subcategories
    prisma.category.create({
      data: {
        slug: 'bags',
        name: 'Bags & Purses',
        parentId: accessories.id,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'jewelry',
        name: 'Jewelry',
        parentId: accessories.id,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'hats',
        name: 'Hats & Caps',
        parentId: accessories.id,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'scarves',
        name: 'Scarves & Wraps',
        parentId: accessories.id,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'belts',
        name: 'Belts',
        parentId: accessories.id,
        sortOrder: 5,
      },
    }),

    // Shoes subcategories
    prisma.category.create({
      data: {
        slug: 'womens-shoes',
        name: "Women's Shoes",
        parentId: shoes.id,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'mens-shoes',
        name: "Men's Shoes",
        parentId: shoes.id,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'kids-shoes',
        name: "Kids' Shoes",
        parentId: shoes.id,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'sneakers',
        name: 'Sneakers',
        parentId: shoes.id,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'boots',
        name: 'Boots',
        parentId: shoes.id,
        sortOrder: 5,
      },
    }),

    // Home goods subcategories
    prisma.category.create({
      data: {
        slug: 'home-decor',
        name: 'Home Decor',
        parentId: homeGoods.id,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'kitchenware',
        name: 'Kitchenware',
        parentId: homeGoods.id,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'bedding',
        name: 'Bedding & Linens',
        parentId: homeGoods.id,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        slug: 'furniture',
        name: 'Small Furniture',
        parentId: homeGoods.id,
        sortOrder: 4,
      },
    }),
  ]);

  const allCategories = [...mainCategories, ...subcategories];

  // =============================================================================
  // PRODUCTS
  // =============================================================================
  console.log('📦 Creating products...');

  const brands = [
    'Zara',
    'H&M',
    'Nike',
    'Adidas',
    "Levi's",
    'Gap',
    'Uniqlo',
    'Forever 21',
    'Mango',
    'ASOS',
    'Urban Outfitters',
    'Free People',
    'Anthropologie',
    'J.Crew',
    'Banana Republic',
    'Ralph Lauren',
    'Tommy Hilfiger',
    'Calvin Klein',
    'Michael Kors',
    'Coach',
    'Kate Spade',
    'Gucci',
    'Prada',
    'Louis Vuitton',
    'Chanel',
    'Burberry',
    'Versace',
    'Armani',
    'Vintage',
    'Handmade',
  ];

  const colors = [
    'Black',
    'White',
    'Navy',
    'Gray',
    'Red',
    'Blue',
    'Green',
    'Brown',
    'Beige',
    'Pink',
    'Purple',
    'Yellow',
    'Orange',
    'Multicolor',
    'Floral',
  ];

  const sizes = [
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
    'One Size',
    'S-M',
    'M-L',
    'L-XL',
  ];
  const genders = ['Women', 'Men', 'Unisex', 'Kids'];
  const conditions = Object.values(ProductCondition);

  const productTemplates = [
    // Women's Dresses
    {
      title: 'Floral Maxi Dress',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['summer', 'floral', 'maxi'],
    },
    {
      title: 'Little Black Dress',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['classic', 'evening', 'cocktail'],
    },
    {
      title: 'Bohemian Midi Dress',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['boho', 'casual', 'midi'],
    },
    {
      title: 'Vintage Polka Dot Dress',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['vintage', 'retro', 'polka-dot'],
    },
    {
      title: 'Summer Sundress',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['summer', 'casual', 'light'],
    },
    {
      title: 'Wrap Dress',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['office', 'elegant', 'wrap'],
    },
    {
      title: 'Shirt Dress',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['casual', 'button-down'],
    },
    {
      title: 'Evening Gown',
      category: 'womens-dresses',
      gender: 'Women',
      tags: ['formal', 'evening', 'elegant'],
    },

    // Women's Tops
    {
      title: 'Silk Blouse',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['silk', 'office', 'elegant'],
    },
    {
      title: 'Vintage Band T-Shirt',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['vintage', 'band', 'casual'],
    },
    {
      title: 'Cashmere Sweater',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['cashmere', 'winter', 'luxury'],
    },
    {
      title: 'Lace Camisole',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['lace', 'romantic', 'layering'],
    },
    {
      title: 'Oversized Cardigan',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['cozy', 'oversized', 'casual'],
    },
    {
      title: 'Crop Top',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['crop', 'trendy', 'summer'],
    },
    {
      title: 'Turtleneck Sweater',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['winter', 'classic', 'warm'],
    },
    {
      title: 'Peasant Blouse',
      category: 'womens-tops',
      gender: 'Women',
      tags: ['boho', 'embroidered', 'romantic'],
    },

    // Women's Bottoms
    {
      title: 'High-Waisted Jeans',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['denim', 'high-waist', 'classic'],
    },
    {
      title: 'Pleated Midi Skirt',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['pleated', 'office', 'elegant'],
    },
    {
      title: 'Leather Pants',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['leather', 'edgy', 'night-out'],
    },
    {
      title: 'Vintage Mom Jeans',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['vintage', 'denim', 'relaxed'],
    },
    {
      title: 'A-Line Skirt',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['classic', 'office', 'versatile'],
    },
    {
      title: 'Wide Leg Trousers',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['wide-leg', 'professional', 'comfortable'],
    },
    {
      title: 'Denim Mini Skirt',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['denim', 'casual', 'summer'],
    },
    {
      title: 'Palazzo Pants',
      category: 'womens-bottoms',
      gender: 'Women',
      tags: ['flowy', 'bohemian', 'comfortable'],
    },

    // Women's Outerwear
    {
      title: 'Vintage Denim Jacket',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['denim', 'vintage', 'casual'],
    },
    {
      title: 'Wool Coat',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['wool', 'winter', 'classic'],
    },
    {
      title: 'Leather Biker Jacket',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['leather', 'edgy', 'iconic'],
    },
    {
      title: 'Trench Coat',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['classic', 'rain', 'timeless'],
    },
    {
      title: 'Faux Fur Coat',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['faux-fur', 'glamorous', 'winter'],
    },
    {
      title: 'Puffer Jacket',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['puffer', 'warm', 'casual'],
    },
    {
      title: 'Blazer',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['office', 'professional', 'versatile'],
    },
    {
      title: 'Bomber Jacket',
      category: 'womens-outerwear',
      gender: 'Women',
      tags: ['bomber', 'casual', 'trendy'],
    },

    // Men's Shirts
    {
      title: 'Oxford Button-Down Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['oxford', 'classic', 'office'],
    },
    {
      title: 'Vintage Hawaiian Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['vintage', 'hawaiian', 'summer'],
    },
    {
      title: 'Flannel Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['flannel', 'plaid', 'casual'],
    },
    {
      title: 'Polo Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['polo', 'preppy', 'casual'],
    },
    {
      title: 'Denim Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['denim', 'western', 'casual'],
    },
    {
      title: 'Linen Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['linen', 'summer', 'breathable'],
    },
    {
      title: 'Band T-Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['band', 'vintage', 'rock'],
    },
    {
      title: 'Henley Shirt',
      category: 'mens-shirts',
      gender: 'Men',
      tags: ['henley', 'casual', 'layering'],
    },

    // Men's Pants
    {
      title: "Vintage Levi's 501",
      category: 'mens-pants',
      gender: 'Men',
      tags: ['levis', 'vintage', 'denim'],
    },
    {
      title: 'Chino Pants',
      category: 'mens-pants',
      gender: 'Men',
      tags: ['chino', 'casual', 'versatile'],
    },
    {
      title: 'Corduroy Pants',
      category: 'mens-pants',
      gender: 'Men',
      tags: ['corduroy', 'retro', 'textured'],
    },
    {
      title: 'Dress Pants',
      category: 'mens-pants',
      gender: 'Men',
      tags: ['formal', 'office', 'dress'],
    },
    {
      title: 'Cargo Pants',
      category: 'mens-pants',
      gender: 'Men',
      tags: ['cargo', 'utility', 'casual'],
    },
    {
      title: 'Jogger Pants',
      category: 'mens-pants',
      gender: 'Men',
      tags: ['jogger', 'comfortable', 'athleisure'],
    },
    {
      title: 'Slim Fit Jeans',
      category: 'mens-pants',
      gender: 'Men',
      tags: ['slim', 'modern', 'denim'],
    },
    {
      title: 'Wool Trousers',
      category: 'mens-pants',
      gender: 'Men',
      tags: ['wool', 'formal', 'winter'],
    },

    // Men's Outerwear
    {
      title: 'Vintage Bomber Jacket',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['bomber', 'vintage', 'military'],
    },
    {
      title: 'Peacoat',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['peacoat', 'classic', 'winter'],
    },
    {
      title: 'Leather Jacket',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['leather', 'iconic', 'timeless'],
    },
    {
      title: 'Denim Jacket',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['denim', 'casual', 'classic'],
    },
    {
      title: 'Varsity Jacket',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['varsity', 'retro', 'sporty'],
    },
    {
      title: 'Quilted Jacket',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['quilted', 'warm', 'preppy'],
    },
    {
      title: 'Windbreaker',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['windbreaker', 'lightweight', 'sporty'],
    },
    {
      title: 'Overcoat',
      category: 'mens-outerwear',
      gender: 'Men',
      tags: ['overcoat', 'formal', 'elegant'],
    },

    // Accessories - Bags
    {
      title: 'Vintage Leather Handbag',
      category: 'bags',
      gender: 'Women',
      tags: ['leather', 'vintage', 'handbag'],
    },
    {
      title: 'Canvas Tote Bag',
      category: 'bags',
      gender: 'Unisex',
      tags: ['canvas', 'tote', 'everyday'],
    },
    {
      title: 'Designer Crossbody Bag',
      category: 'bags',
      gender: 'Women',
      tags: ['designer', 'crossbody', 'luxury'],
    },
    {
      title: 'Leather Messenger Bag',
      category: 'bags',
      gender: 'Men',
      tags: ['leather', 'messenger', 'professional'],
    },
    {
      title: 'Vintage Clutch',
      category: 'bags',
      gender: 'Women',
      tags: ['vintage', 'clutch', 'evening'],
    },
    {
      title: 'Backpack',
      category: 'bags',
      gender: 'Unisex',
      tags: ['backpack', 'practical', 'school'],
    },
    {
      title: 'Woven Basket Bag',
      category: 'bags',
      gender: 'Women',
      tags: ['woven', 'summer', 'boho'],
    },
    {
      title: 'Briefcase',
      category: 'bags',
      gender: 'Men',
      tags: ['briefcase', 'professional', 'leather'],
    },

    // Accessories - Jewelry
    {
      title: 'Vintage Gold Necklace',
      category: 'jewelry',
      gender: 'Women',
      tags: ['gold', 'vintage', 'statement'],
    },
    {
      title: 'Silver Hoop Earrings',
      category: 'jewelry',
      gender: 'Women',
      tags: ['silver', 'hoops', 'classic'],
    },
    {
      title: 'Pearl Bracelet',
      category: 'jewelry',
      gender: 'Women',
      tags: ['pearl', 'elegant', 'timeless'],
    },
    {
      title: 'Vintage Brooch',
      category: 'jewelry',
      gender: 'Women',
      tags: ['brooch', 'vintage', 'collectible'],
    },
    {
      title: 'Statement Ring',
      category: 'jewelry',
      gender: 'Women',
      tags: ['statement', 'bold', 'unique'],
    },
    {
      title: "Men's Watch",
      category: 'jewelry',
      gender: 'Men',
      tags: ['watch', 'classic', 'accessory'],
    },
    {
      title: 'Charm Bracelet',
      category: 'jewelry',
      gender: 'Women',
      tags: ['charm', 'personalized', 'sentimental'],
    },
    {
      title: 'Vintage Cufflinks',
      category: 'jewelry',
      gender: 'Men',
      tags: ['cufflinks', 'formal', 'vintage'],
    },

    // Shoes
    {
      title: 'Vintage Cowboy Boots',
      category: 'boots',
      gender: 'Unisex',
      tags: ['cowboy', 'western', 'vintage'],
    },
    {
      title: 'Classic Sneakers',
      category: 'sneakers',
      gender: 'Unisex',
      tags: ['classic', 'everyday', 'comfortable'],
    },
    {
      title: 'Leather Loafers',
      category: 'mens-shoes',
      gender: 'Men',
      tags: ['loafers', 'classic', 'leather'],
    },
    {
      title: 'Heeled Ankle Boots',
      category: 'boots',
      gender: 'Women',
      tags: ['ankle', 'heeled', 'stylish'],
    },
    {
      title: 'Vintage Running Shoes',
      category: 'sneakers',
      gender: 'Unisex',
      tags: ['vintage', 'running', 'retro'],
    },
    {
      title: 'Mary Jane Heels',
      category: 'womens-shoes',
      gender: 'Women',
      tags: ['mary-jane', 'vintage', 'feminine'],
    },
    {
      title: 'Chelsea Boots',
      category: 'boots',
      gender: 'Unisex',
      tags: ['chelsea', 'classic', 'versatile'],
    },
    {
      title: 'Platform Sandals',
      category: 'womens-shoes',
      gender: 'Women',
      tags: ['platform', 'summer', '90s'],
    },

    // Home Goods
    {
      title: 'Vintage Table Lamp',
      category: 'home-decor',
      gender: 'Unisex',
      tags: ['lamp', 'vintage', 'lighting'],
    },
    {
      title: 'Ceramic Vase Set',
      category: 'home-decor',
      gender: 'Unisex',
      tags: ['ceramic', 'vase', 'decor'],
    },
    {
      title: 'Retro Kitchen Scale',
      category: 'kitchenware',
      gender: 'Unisex',
      tags: ['retro', 'kitchen', 'scale'],
    },
    {
      title: 'Handwoven Throw Blanket',
      category: 'bedding',
      gender: 'Unisex',
      tags: ['handwoven', 'cozy', 'blanket'],
    },
    {
      title: 'Vintage Mirror',
      category: 'home-decor',
      gender: 'Unisex',
      tags: ['mirror', 'vintage', 'decor'],
    },
    {
      title: 'Cast Iron Skillet',
      category: 'kitchenware',
      gender: 'Unisex',
      tags: ['cast-iron', 'kitchen', 'cooking'],
    },
    {
      title: 'Embroidered Pillowcases',
      category: 'bedding',
      gender: 'Unisex',
      tags: ['embroidered', 'vintage', 'bedding'],
    },
    {
      title: 'Mid-Century Side Table',
      category: 'furniture',
      gender: 'Unisex',
      tags: ['mid-century', 'furniture', 'modern'],
    },

    // Vintage specific
    {
      title: '70s Disco Jumpsuit',
      category: 'vintage',
      gender: 'Women',
      tags: ['70s', 'disco', 'jumpsuit'],
    },
    {
      title: '80s Windbreaker',
      category: 'vintage',
      gender: 'Unisex',
      tags: ['80s', 'windbreaker', 'neon'],
    },
    {
      title: '90s Grunge Flannel',
      category: 'vintage',
      gender: 'Unisex',
      tags: ['90s', 'grunge', 'flannel'],
    },
    {
      title: '60s Mod Dress',
      category: 'vintage',
      gender: 'Women',
      tags: ['60s', 'mod', 'mini'],
    },
    {
      title: 'Vintage Band Tour Tee',
      category: 'vintage',
      gender: 'Unisex',
      tags: ['band', 'tour', 'rare'],
    },
    {
      title: 'Retro Tracksuit',
      category: 'vintage',
      gender: 'Unisex',
      tags: ['tracksuit', 'retro', 'sporty'],
    },
    {
      title: '50s Circle Skirt',
      category: 'vintage',
      gender: 'Women',
      tags: ['50s', 'circle', 'rockabilly'],
    },
    {
      title: 'Vintage Silk Scarf',
      category: 'vintage',
      gender: 'Unisex',
      tags: ['silk', 'scarf', 'elegant'],
    },

    // Designer
    {
      title: 'Designer Logo Belt',
      category: 'designer',
      gender: 'Unisex',
      tags: ['designer', 'belt', 'logo'],
    },
    {
      title: 'Luxury Sunglasses',
      category: 'designer',
      gender: 'Unisex',
      tags: ['luxury', 'sunglasses', 'designer'],
    },
    {
      title: 'Designer Silk Tie',
      category: 'designer',
      gender: 'Men',
      tags: ['silk', 'tie', 'luxury'],
    },
    {
      title: 'Vintage Designer Dress',
      category: 'designer',
      gender: 'Women',
      tags: ['vintage', 'designer', 'couture'],
    },
    {
      title: 'Luxury Leather Wallet',
      category: 'designer',
      gender: 'Unisex',
      tags: ['leather', 'wallet', 'luxury'],
    },
    {
      title: 'Designer Cashmere Scarf',
      category: 'designer',
      gender: 'Unisex',
      tags: ['cashmere', 'scarf', 'luxury'],
    },
    {
      title: 'Premium Leather Shoes',
      category: 'designer',
      gender: 'Men',
      tags: ['leather', 'premium', 'italian'],
    },
    {
      title: 'Designer Evening Bag',
      category: 'designer',
      gender: 'Women',
      tags: ['evening', 'designer', 'clutch'],
    },
  ];

  const categoryMap = new Map(allCategories.map((c) => [c.slug, c]));

  const products: any[] = [];
  let productIndex = 0;

  // Create multiple products based on templates
  for (const template of productTemplates) {
    // Create 2-4 variations of each product
    const variationCount = randomBetween(2, 4);

    for (let i = 0; i < variationCount; i++) {
      productIndex++;
      const vendor = randomElement(vendors);
      const category = categoryMap.get(template.category);
      const brand = randomElement(brands);
      const color = randomElement(colors);
      const size = randomElement(sizes);
      const condition = randomElement(conditions);
      const basePrice = randomBetween(15, 300);
      const comparePrice =
        Math.random() > 0.5 ? basePrice * (1.3 + Math.random() * 0.7) : null;

      const titleWithBrand = `${brand} ${template.title}`;
      const slug = `${generateSlug(titleWithBrand)}-${productIndex}`;

      const product = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: category?.id,
          title: titleWithBrand,
          slug,
          description: `Beautiful pre-owned ${template.title.toLowerCase()} from ${brand}. This item is in ${condition.toLowerCase().replace('_', ' ')} condition and perfect for ${template.tags.join(', ')} styles. A great addition to any wardrobe!`,
          price: basePrice,
          comparePrice,
          quantity: randomBetween(1, 3),
          isUnique: Math.random() > 0.3,
          condition,
          brand,
          color,
          size,
          gender: template.gender,
          measurements: ['Women', 'Men'].includes(template.gender)
            ? {
                chest: randomBetween(32, 48),
                length: randomBetween(20, 45),
                waist: randomBetween(24, 40),
              }
            : undefined,
          tags: template.tags,
          isActive: Math.random() > 0.05, // 95% active
          isFeatured: Math.random() > 0.85, // 15% featured
          viewCount: randomBetween(0, 500),
        },
      });

      products.push(product);

      // Create media for product (placeholder URLs)
      const mediaCount = randomBetween(1, 4);
      for (let m = 0; m < mediaCount; m++) {
        await prisma.media.create({
          data: {
            ownerType: MediaOwnerType.PRODUCT,
            ownerId: product.id,
            url: `https://picsum.photos/seed/${product.id}-${m}/800/1000`,
            filename: `product-${product.id}-${m}.jpg`,
            mimeType: 'image/jpeg',
            size: randomBetween(50000, 500000),
            width: 800,
            height: 1000,
            variants: {
              thumb: `https://picsum.photos/seed/${product.id}-${m}/200/250`,
              medium: `https://picsum.photos/seed/${product.id}-${m}/400/500`,
            },
            sortOrder: m,
          },
        });
      }
    }
  }

  console.log(`   Created ${products.length} products`);

  // =============================================================================
  // CART SESSIONS
  // =============================================================================
  console.log('🛒 Creating cart sessions...');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Create cart sessions for some customers
  const cartSessions = await Promise.all(
    customers.slice(0, 8).map((customer) =>
      prisma.cartSession.create({
        data: {
          userId: customer.id,
          expiresAt,
        },
      }),
    ),
  );

  // Add items to carts
  for (const session of cartSessions) {
    const itemCount = randomBetween(1, 4);
    const selectedProducts = products
      .filter((p) => p.isActive && p.quantity > 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    for (const product of selectedProducts) {
      await prisma.cartItem.create({
        data: {
          sessionId: session.id,
          productId: product.id,
          quantity: 1,
        },
      });
    }
  }

  // Create some guest cart sessions
  const guestSessions = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.cartSession.create({
        data: {
          expiresAt,
        },
      }),
    ),
  );

  for (const session of guestSessions) {
    const itemCount = randomBetween(1, 3);
    const selectedProducts = products
      .filter((p) => p.isActive && p.quantity > 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    for (const product of selectedProducts) {
      await prisma.cartItem.create({
        data: {
          sessionId: session.id,
          productId: product.id,
          quantity: 1,
        },
      });
    }
  }

  // =============================================================================
  // ORDERS
  // =============================================================================
  console.log('📋 Creating orders...');

  const orderStatuses = Object.values(OrderStatus);
  const cities = [
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'Phoenix', state: 'AZ', zip: '85001' },
    { city: 'Philadelphia', state: 'PA', zip: '19101' },
    { city: 'San Antonio', state: 'TX', zip: '78201' },
    { city: 'San Diego', state: 'CA', zip: '92101' },
    { city: 'Dallas', state: 'TX', zip: '75201' },
    { city: 'San Jose', state: 'CA', zip: '95101' },
  ];

  let orderNumber = 1;

  // Create orders for registered customers
  for (const customer of customers.slice(0, 12)) {
    const orderCount = randomBetween(1, 4);

    for (let i = 0; i < orderCount; i++) {
      const vendor = randomElement(vendors);
      const vendorProducts = products.filter(
        (p) => p.vendorId === vendor.id && p.isActive,
      );

      if (vendorProducts.length === 0) continue;

      const itemCount = randomBetween(1, 3);
      const orderProducts = vendorProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, itemCount);

      const subtotal = orderProducts.reduce(
        (sum, p) => sum + Number(p.price),
        0,
      );
      const shippingAmount = randomBetween(5, 15);
      const total = subtotal + shippingAmount;

      const status = randomElement(orderStatuses);
      const cityInfo = randomElement(cities);

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(orderNumber++),
          buyerId: customer.id,
          vendorId: vendor.id,
          shippingAddress: {
            name: customer.name,
            street: `${randomBetween(100, 999)} ${randomElement(['Main St', 'Oak Ave', 'Elm Dr', 'Park Blvd', 'Lake Rd'])}`,
            city: cityInfo.city,
            state: cityInfo.state,
            zip: cityInfo.zip,
            country: 'USA',
          },
          shippingMethod: randomElement(['Standard', 'Express', 'Priority']),
          shippingAmount,
          subtotal,
          total,
          status,
          paymentMethod: randomElement([
            PaymentMethod.COD,
            PaymentMethod.COD,
            PaymentMethod.STRIPE,
          ]),
          paymentStatus:
            status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED
              ? PaymentStatus.PAID
              : status === OrderStatus.CANCELLED
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PENDING,
          customerNotes: Math.random() > 0.7 ? 'Please leave at door' : null,
          confirmedAt:
            status !== OrderStatus.PENDING && status !== OrderStatus.CANCELLED
              ? new Date(
                  Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000,
                )
              : null,
          shippedAt:
            status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED
              ? new Date(
                  Date.now() - randomBetween(1, 15) * 24 * 60 * 60 * 1000,
                )
              : null,
          deliveredAt:
            status === OrderStatus.DELIVERED
              ? new Date(Date.now() - randomBetween(1, 7) * 24 * 60 * 60 * 1000)
              : null,
          cancelledAt:
            status === OrderStatus.CANCELLED
              ? new Date(
                  Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000,
                )
              : null,
          items: {
            create: orderProducts.map((p) => ({
              productId: p.id,
              title: p.title,
              price: p.price,
              quantity: 1,
              conditionSnapshot: p.condition,
            })),
          },
        },
      });
    }
  }

  // Create guest orders
  const guestNames = [
    'Alex Johnson',
    'Sam Williams',
    'Jordan Brown',
    'Taylor Davis',
    'Morgan Miller',
    'Casey Wilson',
    'Riley Moore',
    'Jamie Taylor',
    'Drew Anderson',
    'Quinn Thomas',
  ];

  for (let i = 0; i < 15; i++) {
    const vendor = randomElement(vendors);
    const vendorProducts = products.filter(
      (p) => p.vendorId === vendor.id && p.isActive,
    );

    if (vendorProducts.length === 0) continue;

    const itemCount = randomBetween(1, 3);
    const orderProducts = vendorProducts
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    const subtotal = orderProducts.reduce((sum, p) => sum + Number(p.price), 0);
    const shippingAmount = randomBetween(5, 15);
    const total = subtotal + shippingAmount;

    const status = randomElement(orderStatuses);
    const cityInfo = randomElement(cities);
    const guestName = randomElement(guestNames);

    await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(orderNumber++),
        vendorId: vendor.id,
        guestInfo: {
          name: guestName,
          email: `${guestName.toLowerCase().replace(' ', '.')}@guest.com`,
          phone: `+1555${String(randomBetween(1000000, 9999999))}`,
        },
        shippingAddress: {
          name: guestName,
          street: `${randomBetween(100, 999)} ${randomElement(['Main St', 'Oak Ave', 'Elm Dr', 'Park Blvd', 'Lake Rd'])}`,
          city: cityInfo.city,
          state: cityInfo.state,
          zip: cityInfo.zip,
          country: 'USA',
        },
        shippingMethod: randomElement(['Standard', 'Express']),
        shippingAmount,
        subtotal,
        total,
        status,
        paymentMethod: PaymentMethod.COD,
        paymentStatus:
          status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED
            ? PaymentStatus.PAID
            : status === OrderStatus.CANCELLED
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PENDING,
        confirmedAt:
          status !== OrderStatus.PENDING && status !== OrderStatus.CANCELLED
            ? new Date(Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000)
            : null,
        shippedAt:
          status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED
            ? new Date(Date.now() - randomBetween(1, 15) * 24 * 60 * 60 * 1000)
            : null,
        deliveredAt:
          status === OrderStatus.DELIVERED
            ? new Date(Date.now() - randomBetween(1, 7) * 24 * 60 * 60 * 1000)
            : null,
        cancelledAt:
          status === OrderStatus.CANCELLED
            ? new Date(Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000)
            : null,
        items: {
          create: orderProducts.map((p) => ({
            productId: p.id,
            title: p.title,
            price: p.price,
            quantity: 1,
            conditionSnapshot: p.condition,
          })),
        },
      },
    });
  }

  // =============================================================================
  // REVIEWS
  // =============================================================================
  console.log('⭐ Creating reviews...');

  const reviewComments = [
    'Exactly as described! Love it.',
    'Great quality for the price. Very happy with my purchase.',
    'Fast shipping and item was in perfect condition.',
    'A bit smaller than expected but still beautiful.',
    'Amazing vintage find! Will buy again.',
    'Good communication from the seller.',
    'Item was clean and well-packaged.',
    'Slight signs of wear but overall happy.',
    'Better than I expected! Highly recommend this seller.',
    'Perfect addition to my wardrobe.',
    'Quick delivery and exactly what I wanted.',
    'The photos were accurate. No surprises.',
    'Love the quality of this piece!',
    'Fits perfectly and looks great.',
    'Wonderful seller, would recommend.',
  ];

  // Vendor reviews
  for (const vendor of vendors) {
    const reviewCount = randomBetween(3, 15);

    for (let i = 0; i < reviewCount; i++) {
      const reviewer = randomElement(customers);

      await prisma.review.create({
        data: {
          userId: reviewer.id,
          vendorId: vendor.id,
          rating: randomBetween(3, 5),
          title: randomElement([
            'Great seller!',
            'Highly recommend',
            'Good experience',
            'Will buy again',
            'Satisfied customer',
          ]),
          comment: randomElement(reviewComments),
          isVerified: Math.random() > 0.3,
        },
      });
    }
  }

  // Product reviews
  for (const product of products.slice(0, 100)) {
    if (Math.random() > 0.4) continue; // Only 60% of products have reviews

    const reviewCount = randomBetween(1, 5);

    for (let i = 0; i < reviewCount; i++) {
      const reviewer = randomElement(customers);

      await prisma.review.create({
        data: {
          userId: reviewer.id,
          productId: product.id,
          rating: randomBetween(3, 5),
          title: randomElement([
            'Love it!',
            'Great find',
            'Perfect condition',
            'Beautiful piece',
            'Worth the price',
          ]),
          comment: randomElement(reviewComments),
          isVerified: Math.random() > 0.4,
        },
      });
    }
  }

  // =============================================================================
  // SAVED ITEMS (Wishlist)
  // =============================================================================
  console.log('💾 Creating saved items...');

  for (const customer of customers) {
    const savedCount = randomBetween(0, 10);
    const selectedProducts = products
      .filter((p) => p.isActive)
      .sort(() => Math.random() - 0.5)
      .slice(0, savedCount);

    for (const product of selectedProducts) {
      try {
        await prisma.savedItem.create({
          data: {
            userId: customer.id,
            productId: product.id,
          },
        });
      } catch (e) {
        // Skip if duplicate
      }
    }
  }

  // =============================================================================
  // AUDIT LOGS
  // =============================================================================
  console.log('📝 Creating audit logs...');

  const actions = ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'VIEW'];
  const entityTypes = ['User', 'Product', 'Order', 'Vendor'];

  for (let i = 0; i < 50; i++) {
    const user = randomElement([
      adminUser,
      ...customers.slice(0, 5),
      ...vendorUsers.slice(0, 3),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: randomElement(actions),
        entityType: randomElement(entityTypes),
        entityId: products[randomBetween(0, products.length - 1)]?.id,
        ipAddress: `192.168.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        createdAt: new Date(
          Date.now() - randomBetween(1, 90) * 24 * 60 * 60 * 1000,
        ),
      },
    });
  }

  // =============================================================================
  // SUMMARY
  // =============================================================================
  console.log('\n✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(
    `   👤 Users: ${1 + customers.length + vendorUsers.length} (1 admin, ${customers.length} customers, ${vendorUsers.length} vendors)`,
  );
  console.log(`   🏪 Vendors: ${vendors.length}`);
  console.log(`   📁 Categories: ${allCategories.length}`);
  console.log(`   📦 Products: ${products.length}`);
  console.log(
    `   🛒 Cart Sessions: ${cartSessions.length + guestSessions.length}`,
  );
  console.log(`   📋 Orders: ${orderNumber - 1}`);

  const reviewCount = await prisma.review.count();
  const savedCount = await prisma.savedItem.count();
  console.log(`   ⭐ Reviews: ${reviewCount}`);
  console.log(`   💾 Saved Items: ${savedCount}`);

  console.log('\n🔑 Test Credentials:');
  console.log('   Admin: admin@thriftshop.com / password123');
  console.log('   Customer: john.doe@email.com / password123');
  console.log('   Vendor: vintage.vibes@email.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
