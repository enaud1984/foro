import { expect, Page, test } from '@playwright/test';

const soggetti = [
  { id: '1', tipoCodice: 'PERSONA_FISICA', nome: 'Giulia', cognome: 'Ferrari', denominazione: null, codiceFiscale: 'FRRGLI80A01F205X', partitaIva: null, email: 'giulia@example.test', pec: null, telefono: '021234567', cellulare: null, stato: 'ATTIVO', version: 0, creatoIl: '2026-07-29T08:00:00Z', aggiornatoIl: '2026-07-29T08:00:00Z' },
  { id: '2', tipoCodice: 'PERSONA_GIURIDICA', nome: null, cognome: null, denominazione: 'Alfa Srl', codiceFiscale: '01234567890', partitaIva: '01234567890', email: 'info@alfa.test', pec: null, telefono: '029876543', cellulare: null, stato: 'ATTIVO', version: 0, creatoIl: '2026-07-28T08:00:00Z', aggiornatoIl: '2026-07-30T08:00:00Z' },
  { id: '3', tipoCodice: 'PERSONA_FISICA', nome: 'Marco', cognome: 'Bianchi', denominazione: null, codiceFiscale: 'BNCMRC80A01F205X', partitaIva: null, email: 'marco@example.test', pec: null, telefono: '023456789', cellulare: null, stato: 'ATTIVO', version: 0, creatoIl: '2026-07-27T08:00:00Z', aggiornatoIl: '2026-07-31T08:00:00Z' },
];

async function preparaPagina(page: Page): Promise<void> {
  await page.route('**/api/**', async route => {
    const richiesta = route.request();
    const percorso = new URL(richiesta.url()).pathname;
    let risposta: unknown = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    if (percorso === '/api/v1/auth/login') risposta = { accessToken: 'token-e2e', displayName: 'Avv. Test', deveCambiarePassword: false };
    else if (percorso === '/api/v1/studio/profile') risposta = { name: 'Studio E2E', addressLine: 'Via Test 1', city: 'Milano', postalCode: '20100', country: 'Italia', phone: null, website: null, logoUrl: null, primaryColor: '#092746', accentColor: '#c9993a', secondaryColor: '#128c8c', themePreset: 'foro-classic', canEditBranding: false };
    else if (percorso === '/api/v1/workspace/preferences') risposta = { themeMode: 'LIGHT', dashboardDensity: 'COMFORTABLE', personalAccentColor: '#0f766e', widgetLayout: '' };
    else if (percorso === '/api/v1/anagrafiche/cataloghi/tipi-soggetto') risposta = [{ codice: 'PERSONA_FISICA', descrizione: 'Persona fisica', ordine: 1 }, { codice: 'PERSONA_GIURIDICA', descrizione: 'Persona giuridica', ordine: 2 }];
    else if (percorso === '/api/v1/anagrafiche') risposta = { content: soggetti, totalElements: 3, totalPages: 1, number: 0, size: 12 };
    else if (percorso.includes('/collaboratori') || percorso.includes('/calendari') || percorso.includes('/eventi') || percorso.includes('/notifiche')) risposta = [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(risposta) });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Usa credenziali demo' }).click();
  await page.getByRole('button', { name: 'Accedi' }).click();
  const widget = page.locator('[gs-id="clienti"]');
  await widget.getByRole('button', { name: 'Azioni widget Anagrafiche' }).click();
  await widget.getByRole('button', { name: 'Apri vista completa' }).click();
  await expect(page.locator('ag-grid-angular[aria-label="Elenco Anagrafiche"]')).toBeVisible();
}

test('mostra header, tre righe, paginazione, filtro e ordinamento ai breakpoint', async ({ page }, testInfo) => {
  const erroriConsole: string[] = [];
  page.on('console', messaggio => { if (messaggio.type() === 'error') erroriConsole.push(messaggio.text()); });
  await preparaPagina(page);
  const griglia = page.locator('ag-grid-angular[aria-label="Elenco Anagrafiche"]');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await expect(griglia.locator('.ag-header-cell')).toHaveCount(8);
    await expect(griglia.locator('.ag-center-cols-container .ag-row')).toHaveCount(3);
    await expect(griglia.getByText('Giulia Ferrari')).toBeVisible();
    await expect(griglia.locator('.ag-paging-row-summary-panel')).toContainText(/1\s+a\s+3\s+di\s+3/);
    const misure = await griglia.evaluate(elemento => {
      const altezza = (selettore: string) => elemento.querySelector<HTMLElement>(selettore)?.getBoundingClientRect().height ?? -1;
      return { esterno: elemento.getBoundingClientRect().height, wrapper: altezza('.ag-root-wrapper'), root: altezza('.ag-root'), header: altezza('.ag-header'), body: altezza('.ag-body'), viewport: altezza('.ag-center-cols-viewport'), overflow: getComputedStyle(elemento).overflow };
    });
    expect(misure.esterno).toBeGreaterThan(200);
    expect(misure.body).toBeGreaterThan(0);
    expect(misure.header).toBeGreaterThan(0);
    expect(misure.overflow).not.toBe('hidden');
    await testInfo.attach(`misure-${viewport.width}x${viewport.height}`, { body: JSON.stringify(misure, null, 2), contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath(`anagrafiche-${viewport.width}x${viewport.height}.png`), fullPage: true });
  }
  const ricerca = page.getByPlaceholder('Cerca anagrafiche…');
  await ricerca.fill('Giulia');
  await expect(griglia.locator('.ag-center-cols-container .ag-row')).toHaveCount(1);
  await ricerca.fill('');
  await griglia.getByText('Soggetto', { exact: true }).click();
  await expect(griglia.locator('.ag-header-cell').first()).toHaveAttribute('aria-sort', 'ascending');
  expect(erroriConsole).toEqual([]);
});
