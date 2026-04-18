import dotenv from "dotenv";

dotenv.config();

const config = {
  appUrl: process.env.APP_URL || "",
  name: process.env.NAME || "",
  port: process.env.PORT || 5000,
  version: process.env.VERSION || "",
  jwtSecret: process.env.JWT_SECRET || "",
  feature: {
    admin: {
      enabled: parseInt(process.env.FEATURE_ADMIN_ENABLED) || false,
    },
  },
  mongodbUrl: process.env.MONGODB_URL || "",
  /** Comma-separated host:port seeds (e.g. Atlas shard hosts). If set with mongodb+srv, we connect via mongodb:// seeds to avoid Node SRV/querySrv issues on some Windows setups. */
  mongodbAtlasSeeds: (process.env.MONGODB_ATLAS_SEEDS || "").trim(),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  emailApiKey: process.env.EMAIL_API_KEY || "",
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o",
  },
  /** Azure OpenAI: if AZURE_OPENAI_API_KEY + AZURE_RESOURCE_NAME (or AZURE_OPENAI_ENDPOINT) are set, embeddings + chat use Azure. */
  azureOpenAI: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || "",
    resourceName: process.env.AZURE_RESOURCE_NAME || "",
    /** Full URL e.g. https://your-resource.openai.azure.com/ — overrides resource name if set */
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || process.env.OPENAI_API_VERSION || "2024-10-21",
    /** Azure deployment names (as shown in Azure AI Studio / portal) */
    embeddingDeployment:
      process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-3-small",
    chatDeployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || process.env.OPENAI_CHAT_MODEL || "gpt-4o",
    /** Optional: set if your embedding model dimension differs from 1536 */
    embeddingDimensions: process.env.AZURE_EMBEDDING_DIMENSIONS || "",
  },
  supabase: {
    /** Direct Postgres connection string (Supabase: Project Settings → Database → URI) */
    databaseUrl: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "",
  },
};

export default config;
