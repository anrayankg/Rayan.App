// Серверный маршрут: сам ищет координаты через OpenStreetMap (Nominatim).
// Раньше это делал браузер телефона напрямую — там это ненадёжно
// (геосервис требует представляться и не любит частые запросы с сайтов).
// С сервера — стабильнее.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return Response.json({ candidates: [] });
  }

  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=3&q=${encodeURIComponent(q)}`,
      {
        headers: {
          "Accept-Language": "ru",
          "User-Agent": "RAYAN-real-estate (rayan.app, agency tool, Bishkek)",
        },
      }
    );
    const results = await r.json();
    if (results && results.length > 0) {
      return Response.json({
        candidates: results.map((r) => ({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          name: r.display_name || "",
        })),
      });
    }
  } catch (e) {
    // молча возвращаем "не нашли" — форма не должна падать из-за карты
  }

  return Response.json({ candidates: [] });
}
