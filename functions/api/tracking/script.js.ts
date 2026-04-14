export const onRequestGet: PagesFunction = async () => {
  const script = `
    (function() {
      window.Thinksmart = {
        track: function(type, value, metadata) {
          return fetch('/api/conversions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, value, metadata })
          }).then(res => res.json());
        }
      };
    })();
  `;

  return new Response(script, {
    headers: { 'Content-Type': 'application/javascript' }
  });
};
