import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Currency {
  id: string;
  code: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
}

const CURRENCY_KEY = "storefront_currency";

export function useCurrency(storeId: string) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>(() => {
    return localStorage.getItem(CURRENCY_KEY) || "";
  });

  useEffect(() => {
    if (!storeId) return;
    supabase.from("currencies" as any).select("id, code, symbol, exchange_rate, is_default")
      .eq("store_id", storeId).eq("is_active", true).order("is_default", { ascending: false })
      .then(({ data }) => {
        const list = (data || []) as unknown as Currency[];
        setCurrencies(list);
        if (!selectedCode && list.length > 0) {
          const def = list.find(c => c.is_default) || list[0];
          setSelectedCode(def.code);
        }
      });
  }, [storeId]);

  const current = currencies.find(c => c.code === selectedCode) || currencies[0];

  const convert = (priceInBase: number): string => {
    if (!current || current.is_default) return `${current?.symbol || "$"}${priceInBase.toFixed(2)}`;
    const converted = priceInBase * Number(current.exchange_rate);
    return `${current.symbol}${converted.toFixed(2)}`;
  };

  const switchCurrency = (code: string) => {
    setSelectedCode(code);
    localStorage.setItem(CURRENCY_KEY, code);
  };

  return { currencies, current, convert, switchCurrency, selectedCode };
}

interface CurrencySwitcherProps {
  currencies: Currency[];
  selectedCode: string;
  onSwitch: (code: string) => void;
}

export function CurrencySwitcher({ currencies, selectedCode, onSwitch }: CurrencySwitcherProps) {
  if (currencies.length <= 1) return null;

  return (
    <Select value={selectedCode} onValueChange={onSwitch}>
      <SelectTrigger className="w-[70px] h-8 text-xs border-0 bg-transparent focus:ring-0 px-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map(c => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-mono text-xs">{c.symbol} {c.code}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
