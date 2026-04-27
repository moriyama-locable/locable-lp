export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { name, email, company, message, _hp } = await request.json();

    // honeypot
    if (_hp) return new Response('Bad Request', { status: 400 });

    // バリデーション
    if (!name || !email || !message) {
      return Response.json({ error: '必須項目が未入力です' }, { status: 400 });
    }

    // Resend送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'no-reply@locable.co.jp',
        to:   'info@locable.co.jp',
        reply_to: email,
        subject: `【LP問い合わせ】${name}様 / ${company || '会社名未記入'}`,
        html: `
          <p><b>お名前：</b>${name}</p>
          <p><b>会社名：</b>${company || '—'}</p>
          <p><b>メール：</b>${email}</p>
          <hr>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return Response.json({ error: '送信に失敗しました' }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (e) {
    console.error('Unexpected error:', e);
    return Response.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
