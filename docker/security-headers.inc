# Security headers shared by every location block. # nginx drops inherited add_header directives
once a location defines its own, # so each location includes this file explicitly. # Keep the
Content-Security-Policy in sync with vite.config.ts. add_header Content-Security-Policy "default-src
'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src
'self' data: blob: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'
https://fonts.googleapis.com https://fonts.gstatic.com; worker-src 'self' blob:; manifest-src
'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always; add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "no-referrer" always; add_header Permissions-Policy "camera=(),
microphone=(), geolocation=(), payment=(), usb=()" always; add_header Cross-Origin-Opener-Policy
"same-origin" always; add_header Cross-Origin-Resource-Policy "same-origin" always;
