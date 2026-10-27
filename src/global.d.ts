import type fr from "../messages/fr.json";
import type { AppLocale } from "./lib/constants";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof fr;
  }
}
