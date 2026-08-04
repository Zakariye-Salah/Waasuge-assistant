
# Waasuge Assistant integration

Add this CSS once on every app page that should show the assistant:

```html
<link rel="stylesheet" href="./css/assistant.css">
```

Add this JS once near the end of the `<body>` on every app page that should show the assistant:

```html
<script type="module" src="./js/assistant.js"></script>
```

Recommended placement:
- after `main.js`
- after `database.js`
- after `navbar.js`
- before `</body>`

You do not need to write a separate assistant modal in HTML. The module injects the button, panel, chat, and shortcut chips automatically.

Use the same include on:
- `dashboard.html`
- `customers.html`
- `repairing.html`
- `product.html`
- `invoice.html`
- `expenses.html`
- `report.html`
- `settings.html`

Do not add it to `login.html`.

If you want the assistant to open on a specific page action from a button click, let the assistant module handle it through the existing page buttons and data-action rows.
