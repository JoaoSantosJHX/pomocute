module.exports = async (request, response) => {
  const rawUrl = Array.isArray(request.query.url) ? request.query.url[0] : request.query.url;
  if (typeof rawUrl !== 'string' || rawUrl.length > 2048) return response.status(400).json({ error: 'Link inválido.' });

  let videoUrl;
  try {
    videoUrl = new URL(rawUrl);
  } catch (_) {
    return response.status(400).json({ error: 'Link inválido.' });
  }

  const host = videoUrl.hostname.replace(/^www\./, '').toLowerCase();
  if (host !== 'youtu.be' && host !== 'youtube.com' && !host.endsWith('.youtube.com')) return response.status(400).json({ error: 'Use um link do YouTube.' });

  try {
    const metadataResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl.toString())}&format=json`);
    if (!metadataResponse.ok) return response.status(404).json({ error: 'Vídeo não encontrado.' });
    const metadata = await metadataResponse.json();
    const title = typeof metadata.title === 'string' ? metadata.title.trim().replace(/\s+/g, ' ').slice(0, 280) : '';
    if (!title) return response.status(404).json({ error: 'Título indisponível.' });
    response.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return response.status(200).json({ title });
  } catch (_) {
    return response.status(502).json({ error: 'Não foi possível consultar o YouTube.' });
  }
};
