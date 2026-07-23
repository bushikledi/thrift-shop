-- Platform-wide settings editable from the admin panel.
--
-- Single-row ("singleton") table: the admin settings screen previously showed a
-- success toast without persisting anything. maintenance_mode is enforced by
-- the API, not merely recorded.

CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "site_name" TEXT NOT NULL DEFAULT 'ThriftShop',
    "site_description" TEXT,
    "support_email" TEXT,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
