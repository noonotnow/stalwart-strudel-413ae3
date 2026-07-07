// TEMPORARY diagnostic endpoint — not part of the product. Used to inspect why
// per-item subject filtering drops so many SerpAPI candidates for a given query.
// Delete before merging PR #24.
export async function handler(event) {
  const q = (event.queryStringParameters?.q || "").trim();
  const engine = (event.queryStringParameters?.engine || "google_images").trim();
  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "no serp key" }) };
  }
  const serpUrl =
    "https://serpapi.com/search.json" +
    `?engine=${engine}` +
    `&q=${encodeURIComponent(q)}` +
    `&api_key=${serpKey}`;
  const resp = await fetch(serpUrl);
  const data = await resp.json();
  const raw = Array.isArray(data.images_results) ? data.images_results : [];

  const subjectToken = q.split(/\s+/)[0] || "";
  const NON_SUBJECT_KEYWORDS = [
    "中国地图", "世界地图", "地形图", "省份地图", "行政区划地图", "地图查询", "地图库",
    "皇帝画像", "帝王画像", "古代帝王画像", "历代帝王图", "历史人物画像", "肖像画", "国画欣赏", "水墨人物画",
    "app store", "应用商店", "apple music", "google play", "下载量", "好评率", "应用截图", "app截图"
  ];
  const ALL_ACTOR_NAME_TOKENS_STR = "刘宇宁,宇宁,刘学义,学义,宋威龙,威龙,张凌赫,凌赫,敖瑞鹏,瑞鹏,丁禹兮,禹兮,王鹤棣,鹤棣,王以纶,以纶".split(",");

  const rejections = [];
  let noTitle = 0, noThumb = 0, adTitle = 0, placeholder = 0, commerce = 0, nonSubject = 0, otherActor = 0, dupe = 0, kept = 0;
  const seenThumbs = new Set();
  for (const item of raw) {
    const title = item.title || "";
    const thumb = item.thumbnail || "";
    const link = item.link || item.original || "";
    if (!thumb || !link) { noThumb++; continue; }
    const lowerTitle = title.toLowerCase();
    if (["变美","变瘦","变卡通","最瘦","广告","推广","sponsored","一键变","ai生成","ai换脸","ai写真","减肥","塑形","瘦身"].some(p => lowerTitle.includes(p.toLowerCase()))) { adTitle++; rejections.push({stage:"ad", title}); continue; }
    if (["favicon","static/baike","baike.png","x320.png","/logo.","_logo.","-logo.","/logos/"].some(p => thumb.toLowerCase().includes(p))) { placeholder++; continue; }
    if (NON_SUBJECT_KEYWORDS.some(k => lowerTitle.includes(k.toLowerCase()))) { nonSubject++; rejections.push({stage:"non_subject", title}); continue; }
    if (ALL_ACTOR_NAME_TOKENS_STR.some(tok => tok !== subjectToken && title.includes(tok) && !title.includes(subjectToken))) { otherActor++; rejections.push({stage:"other_actor", title}); continue; }
    const thumbKey = thumb.split("?")[0].toLowerCase();
    if (thumbKey && seenThumbs.has(thumbKey)) { dupe++; continue; }
    seenThumbs.add(thumbKey);
    kept++;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: q, engine, rawCount: raw.length,
      counts: { noThumb, adTitle, placeholder, nonSubject, otherActor, dupe, kept },
      sampleTitles: raw.slice(0, 15).map(r => r.title),
      sampleThumbs: raw.slice(0, 15).map(r => r.thumbnail),
      rejectionSamples: rejections.slice(0, 20)
    })
  };
}
