import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Mail, Link2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;
  title: string;
  image?: string;
}

export function SocialShare({ url, title, image }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const share = (platform: string) => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${image ? `&media=${encodeURIComponent(image)}` : ""}`,
      email: `mailto:?subject=${encodedTitle}&body=Check this out: ${encodedUrl}`,
    };
    if (platform === "email") {
      window.location.href = urls[platform];
    } else {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1">Share:</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => share("facebook")} title="Share on Facebook">
        <Facebook className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => share("twitter")} title="Share on X/Twitter">
        <Twitter className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => share("pinterest")} title="Pin on Pinterest">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => share("email")} title="Share via Email">
        <Mail className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyLink} title="Copy link">
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
