import { expect, Locator, Page, test } from '@playwright/test';

type Layout = Array<{ key: string; x: number; y: number; w: number; h: number; versioneLayout: number }>;

const profilo = {
  name: 'Studio E2E', addressLine: 'Via Test 1', city: 'Milano', postalCode: '20100', country: 'Italia',
  phone: null, website: null, logoUrl: null, primaryColor: '#092746', accentColor: '#c9993a',
  secondaryColor: '#128c8c', themePreset: 'foro-classic', canEditBranding: false
};

async function preparaApi(page: Page): Promise<{ layoutSalvato: () => Layout }> {
  let layout: Layout = [];
  await page.route('**/api/**', async route => {
    const richiesta = route.request();
    const percorso = new URL(richiesta.url()).pathname;
    let risposta: unknown = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    if (percorso === '/api/v1/auth/login') {
      risposta = { accessToken: 'token-e2e', displayName: 'Avv. Test', deveCambiarePassword: false };
    } else if (percorso === '/api/v1/studio/profile') {
      risposta = profilo;
    } else if (percorso === '/api/v1/workspace/preferences') {
      if (richiesta.method() === 'PUT') layout = JSON.parse((richiesta.postDataJSON() as { widgetLayout: string }).widgetLayout);
      risposta = { themeMode: 'LIGHT', dashboardDensity: 'COMFORTABLE', personalAccentColor: '#0f766e', widgetLayout: layout.length ? JSON.stringify(layout) : '' };
    } else if (percorso.includes('/collaboratori') || percorso.includes('/calendari') || percorso.includes('/eventi') || percorso.includes('/notifiche')) {
      risposta = [];
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(risposta) });
  });
  return { layoutSalvato: () => layout };
}

async function apriScrivania(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Usa credenziali demo' }).click();
  await page.getByRole('button', { name: 'Accedi' }).click();
  await expect(page.locator('.grid-stack')).toHaveClass(/gs-12/);
  await expect(page.locator('.grid-stack-item')).toHaveCount(5);
}

async function aggiornaESbloccaScrivania(page: Page): Promise<void> {
  await page.reload();
  await page.getByRole('button', { name: 'Usa credenziali demo' }).click();
  await page.getByRole('button', { name: 'Accedi' }).click();
  await expect(page.locator('.grid-stack-item')).toHaveCount(5);
}

async function trascina(page: Page, widget: Locator, destinazione: Locator, durante?: () => Promise<void>): Promise<void> {
  const testata = widget.locator('.op-head');
  const partenza = await testata.boundingBox();
  const boxWidget = await widget.boundingBox();
  const arrivo = await destinazione.boundingBox();
  expect(partenza).not.toBeNull(); expect(boxWidget).not.toBeNull(); expect(arrivo).not.toBeNull();
  await page.mouse.move(partenza!.x + 70, partenza!.y + partenza!.height / 2);
  await page.mouse.down();
  const xIniziale = partenza!.x + 70; const yIniziale = partenza!.y + partenza!.height / 2;
  const xFinale = arrivo!.x + xIniziale - boxWidget!.x;
  const yFinale = arrivo!.y + yIniziale - boxWidget!.y;
  for (let passo = 1; passo <= 16; passo++) {
    await page.mouse.move(xIniziale + (xFinale - xIniziale) * passo / 16, yIniziale + (yFinale - yIniziale) * passo / 16);
    await page.waitForTimeout(35);
  }
  if (durante) await durante();
  await page.mouse.up();
  await expect(widget).not.toHaveClass(/ui-draggable-dragging/);
}

async function ridimensiona(page: Page, widget: Locator, dx = 100, dy = 60, durante?: () => Promise<void>): Promise<void> {
  const maniglia = widget.locator('.ui-resizable-se');
  const box = await maniglia.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  const x = box!.x + box!.width / 2; const y = box!.y + box!.height / 2;
  for (let passo = 1; passo <= 12; passo++) {
    await page.mouse.move(x + dx * passo / 12, y + dy * passo / 12);
    await page.waitForTimeout(35);
  }
  if (durante) await durante();
  await page.mouse.up();
  await expect(widget).not.toHaveClass(/ui-resizable-resizing/);
}

test.describe('Scrivania GridStack reale', () => {
  test('usa dimensioni moderate e consente tre widget sulla stessa riga', async ({ page }, testInfo) => {
    await preparaApi(page); await apriScrivania(page);
    const griglia = page.locator('.grid-stack');
    const calendario = griglia.locator('[gs-id="calendario"]');
    const boxGriglia = await griglia.boundingBox(); const boxCalendario = await calendario.boundingBox();
    expect(boxCalendario!.width).toBeLessThan(boxGriglia!.width * 0.55);
    expect(Number(await calendario.getAttribute('gs-w'))).toBe(5);
    const primeRighe = await griglia.locator('.grid-stack-item').evaluateAll(elementi => elementi.filter(elemento => Number(elemento.getAttribute('gs-y')) === 0).length);
    expect(primeRighe).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath('layout-iniziale.png'), fullPage: true });
  });

  test('trascina con placeholder, collisione durante mouse-down e persistenza', async ({ page }, testInfo) => {
    const api = await preparaApi(page); await apriScrivania(page);
    const calendario = page.locator('[gs-id="calendario"]'); const documenti = page.locator('[gs-id="documenti"]');
    const posizioneDocumenti = await documenti.boundingBox();
    await page.screenshot({ path: testInfo.outputPath('prima-drag.png'), fullPage: true });
    await trascina(page, calendario, documenti, async () => {
      await expect(page.locator('.grid-stack-placeholder')).toBeVisible();
      await expect(calendario).toHaveClass(/ui-draggable-dragging/);
      const durante = await documenti.boundingBox();
      expect(Math.abs(durante!.y - posizioneDocumenti!.y) + Math.abs(durante!.x - posizioneDocumenti!.x)).toBeGreaterThan(20);
      await page.screenshot({ path: testInfo.outputPath('durante-collisione.png'), fullPage: true });
    });
    await expect.poll(() => api.layoutSalvato().length).toBe(5);
    const coordinate = await calendario.evaluate(elemento => {
      const nodo = (elemento as HTMLElement & { gridstackNode?: { x?: number; y?: number } }).gridstackNode;
      return { x: nodo?.x, y: nodo?.y };
    });
    await aggiornaESbloccaScrivania(page);
    await expect.poll(() => page.locator('[gs-id="calendario"]').evaluate(elemento => {
      const nodo = (elemento as HTMLElement & { gridstackNode?: { x?: number; y?: number } }).gridstackNode;
      return { x: nodo?.x, y: nodo?.y };
    })).toEqual(coordinate);
    await page.screenshot({ path: testInfo.outputPath('dopo-drop-refresh.png'), fullPage: true });
  });

  test('ridimensiona dall’angolo sud-est e persiste la nuova taglia', async ({ page }, testInfo) => {
    const api = await preparaApi(page); await apriScrivania(page);
    const widget = page.locator('[gs-id="documenti"]'); const prima = await widget.boundingBox();
    const maniglia = widget.locator('.ui-resizable-se');
    await expect(maniglia).toBeVisible(); await expect(maniglia).toHaveCSS('cursor', 'nwse-resize');
    await ridimensiona(page, widget, 110, 10, async () => {
      const durante = await widget.boundingBox();
      expect(durante!.width).toBeGreaterThan(prima!.width + 30);
      await page.screenshot({ path: testInfo.outputPath('durante-resize.png'), fullPage: true });
    });
    const taglia = { w: await widget.getAttribute('gs-w'), h: await widget.getAttribute('gs-h') };
    expect(Number(taglia.w) > 4 || Number(taglia.h) > 5).toBeTruthy();
    await expect.poll(() => api.layoutSalvato().find(elemento => elemento.key === 'documenti')).toEqual(expect.objectContaining({ w: Number(taglia.w), h: Number(taglia.h) }));
    await aggiornaESbloccaScrivania(page);
    await expect(page.locator('[gs-id="documenti"]')).toHaveAttribute('gs-w', taglia.w!);
    await page.screenshot({ path: testInfo.outputPath('dopo-resize-refresh.png'), fullPage: true });
  });

  test('resta interattiva nelle sequenze drag-resize e i pulsanti non trascinano', async ({ page }) => {
    await preparaApi(page); await apriScrivania(page);
    const calendario = page.locator('[gs-id="calendario"]'); const documenti = page.locator('[gs-id="documenti"]');
    await ridimensiona(page, calendario, 90, 55);
    await trascina(page, calendario, documenti);
    await trascina(page, calendario, documenti);
    await ridimensiona(page, calendario, -70, 55);
    await ridimensiona(page, calendario, 70, -45);
    await page.waitForTimeout(500);
    const primaClick = await calendario.evaluate(elemento => {
      const nodo = (elemento as HTMLElement & { gridstackNode?: { x?: number; y?: number; w?: number; h?: number } }).gridstackNode;
      return { x: nodo?.x, y: nodo?.y, w: nodo?.w, h: nodo?.h };
    });
    await calendario.getByRole('button', { name: /Azioni widget/ }).click();
    await expect(page.locator('.widget-actions-menu')).toBeVisible();
    const dopoClick = await calendario.evaluate(elemento => {
      const nodo = (elemento as HTMLElement & { gridstackNode?: { x?: number; y?: number; w?: number; h?: number } }).gridstackNode;
      return { x: nodo?.x, y: nodo?.y, w: nodo?.w, h: nodo?.h };
    });
    expect(dopoClick).toEqual(primaClick);
    await expect(calendario.locator('.ui-resizable-se')).toBeVisible();
  });

  test('mantiene ogni widget nei limiti e senza sovrapposizioni ai breakpoint', async ({ page }) => {
    await preparaApi(page); await apriScrivania(page);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(800);
      const risultato = await page.locator('.grid-stack').evaluate(griglia => {
        const area = griglia.getBoundingClientRect();
        const box = [...griglia.querySelectorAll<HTMLElement>(':scope > .grid-stack-item')].map(elemento => elemento.getBoundingClientRect());
        const sovrapposte = box.some((a, i) => box.slice(i + 1).some(b => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1));
        return { dentro: box.every(item => item.left >= area.left - 1 && item.right <= area.right + 1), sovrapposte };
      });
      expect(risultato).toEqual({ dentro: true, sovrapposte: false });
    }
  });
});
