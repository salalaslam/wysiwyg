import { isStandaloneHtmlDocument } from "@/lib/html-templates";

export function extractTitle(html: string) {
  const documentTitle = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (documentTitle?.[1]) {
    return documentTitle[1].replace(/<[^>]+>/g, "").trim();
  }

  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return match?.[1]?.replace(/<[^>]+>/g, "").trim() || "Draftroom Export";
}

export function extractEditableHtml(html: string) {
  if (!isStandaloneHtmlDocument(html)) {
    return html;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  return document.body.innerHTML.trim();
}

export function replaceStandaloneBodyHtml(documentHtml: string, bodyHtml: string) {
  if (!isStandaloneHtmlDocument(documentHtml)) {
    return bodyHtml;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(documentHtml, "text/html");
  document.body.innerHTML = bodyHtml;
  return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
}

export function extractTemplateStyles(html: string) {
  if (!isStandaloneHtmlDocument(html)) {
    return "";
  }

  return Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}

function scopeCssSelector(selector: string, scopeSelector: string) {
  const trimmedSelector = selector.trim();

  if (!trimmedSelector) {
    return "";
  }

  if (trimmedSelector === "*") {
    return `${scopeSelector} *`;
  }

  if (/^(html|body|:root)$/i.test(trimmedSelector)) {
    return scopeSelector;
  }

  const replacedSelector = trimmedSelector
    .replace(/:root/gi, scopeSelector)
    .replace(/\bhtml\b/gi, scopeSelector)
    .replace(/\bbody\b/gi, scopeSelector)
    .replace(new RegExp(`${scopeSelector}\\s+${scopeSelector}`, "g"), scopeSelector)
    .trim();

  if (replacedSelector.includes(scopeSelector)) {
    return replacedSelector;
  }

  return `${scopeSelector} ${replacedSelector}`;
}

export function scopeCssText(css: string, scopeSelector: string) {
  return css.replace(/(^|}|\s)([^{}@]+)\{/g, (match, prefix, selectors) => {
    const trimmedSelectors = selectors.trim();

    if (!trimmedSelectors || trimmedSelectors.startsWith("from") || trimmedSelectors.startsWith("to") || /\d+%$/.test(trimmedSelectors)) {
      return match;
    }

    const scopedSelectors = trimmedSelectors
      .split(",")
      .map((selector: string) => scopeCssSelector(selector, scopeSelector))
      .filter(Boolean)
      .join(", ");

    return `${prefix}${scopedSelectors} {`;
  });
}