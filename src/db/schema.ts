import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const collectionCards = pgTable("collection_cards", {
  id: serial("id").primaryKey(),
  tcgId: text("tcg_id"),
  name: text("name").notNull(),
  cardNumber: text("card_number").notNull(),
  setTotal: text("set_total"),
  setName: text("set_name").notNull(),
  setId: text("set_id"),
  setSymbolUrl: text("set_symbol_url"),
  rarity: text("rarity").default("Rare").notNull(),
  pokemonType: text("pokemon_type").default("Colorless").notNull(),
  hp: integer("hp"),
  stage: text("stage"),
  illustrator: text("illustrator"),
  attacksJson: text("attacks_json"),
  imageUrl: text("image_url").notNull(),
  capturedPhotoUrl: text("captured_photo_url"),
  photoId: integer("photo_id"),
  language: text("language").default("English").notNull(),
  variant: text("variant").default("Holofoil").notNull(),
  condition: text("condition").default("Near Mint").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  marketPrice: numeric("market_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(1).notNull(),
  forSale: boolean("for_sale").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cardPhotos = pgTable("card_photos", {
  id: serial("id").primaryKey(),
  mimeType: text("mime_type").default("image/jpeg").notNull(),
  dataBase64: text("data_base64").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderInquiries = pgTable("order_inquiries", {
  id: serial("id").primaryKey(),
  buyerName: text("buyer_name"),
  buyerNote: text("buyer_note"),
  itemsJson: text("items_json").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  totalCards: integer("total_cards").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const seedMeta = pgTable("seed_meta", {
  key: text("key").primaryKey(),
  seededAt: timestamp("seeded_at").defaultNow().notNull(),
});

export type CollectionCard = typeof collectionCards.$inferSelect;
export type NewCollectionCard = typeof collectionCards.$inferInsert;
export type OrderInquiry = typeof orderInquiries.$inferSelect;
