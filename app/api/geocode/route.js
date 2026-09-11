// Серверный маршрут: сам ищет координаты через OpenStreetMap (Nominatim).
// Раньше это делал браузер телефона напрямую — там это ненадёжно
// (геосервис требует представляться и не любит частые запросы с сайтов).
// С сервера — стабильнее.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return Response.json({ lat: null, lng: null });
  }

  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: {
          "Accept-Language": "ru",
          "User-Agent": "RAYAN-real-estate (rayan.app, agency tool, Bishkek)",
        },
      }
    );
    const results = await r.json();
    if (results && results[0]) {
      return Response.json({
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      });
    }
  } catch (e) {
    // молча возвращаем "не нашли" — форма не должна падать из-за карты
  }

  return Response.json({ lat: null, lng: null });
}
