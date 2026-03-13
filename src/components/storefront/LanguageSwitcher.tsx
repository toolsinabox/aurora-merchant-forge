import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Language {
  id: string;
  locale: string;
  name: string;
  is_default: boolean;
}

interface Translation {
  field_name: string;
  translated_value: string;
  entity_type: string;
  entity_id: string | null;
}

interface LanguageContextType {
  locale: string;
  languages: Language[];
  switchLanguage: (locale: string) => void;
  t: (key: string, fallback?: string) => string;
  tEntity: (entityType: string, entityId: string, field: string, fallback?: string) => string;
}

const LANG_KEY = "storefront_language";

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  languages: [],
  switchLanguage: () => {},
  t: (_k, f) => f || "",
  tEntity: (_e, _i, _f, fb) => fb || "",
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ storeId, children }: { storeId: string; children: React.ReactNode }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [locale, setLocale] = useState(() => localStorage.getItem(LANG_KEY) || "en");
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!storeId) return;
    supabase.from("store_languages" as any)
      .select("id, locale, name, is_default")
      .eq("store_id", storeId).eq("is_active", true)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        const list = (data || []) as unknown as Language[];
        setLanguages(list);
        if (!localStorage.getItem(LANG_KEY) && list.length > 0) {
          const def = list.find(l => l.is_default) || list[0];
          setLocale(def.locale);
        }
      });
  }, [storeId]);

  useEffect(() => {
    if (!storeId || !locale) return;
    supabase.from("store_translations" as any)
      .select("field_name, translated_value, entity_type, entity_id")
      .eq("store_id", storeId).eq("locale", locale)
      .then(({ data }) => {
        const map = new Map<string, string>();
        ((data || []) as unknown as Translation[]).forEach(t => {
          const key = t.entity_id
            ? `${t.entity_type}:${t.entity_id}:${t.field_name}`
            : `${t.entity_type}:${t.field_name}`;
          map.set(key, t.translated_value);
        });
        setTranslations(map);
      });
  }, [storeId, locale]);

  const switchLanguage = useCallback((newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem(LANG_KEY, newLocale);
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return translations.get(`ui:${key}`) || fallback || key;
  }, [translations]);

  const tEntity = useCallback((entityType: string, entityId: string, field: string, fallback?: string): string => {
    return translations.get(`${entityType}:${entityId}:${field}`) || fallback || "";
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ locale, languages, switchLanguage, t, tEntity }}>
      {children}
    </LanguageContext.Provider>
  );
}

interface LanguageSwitcherProps {
  languages: Language[];
  locale: string;
  onSwitch: (locale: string) => void;
}

export function LanguageSwitcher({ languages, locale, onSwitch }: LanguageSwitcherProps) {
  if (languages.length <= 1) return null;

  return (
    <Select value={locale} onValueChange={onSwitch}>
      <SelectTrigger className="w-[80px] h-8 text-xs border-0 bg-transparent focus:ring-0 px-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map(l => (
          <SelectItem key={l.locale} value={l.locale}>
            <span className="text-xs">{l.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
