from playwright.sync_api import sync_playwright
import time
import sys

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            headless=True
        )
        context = browser.new_context()
        page = context.new_page()

        print('1. Navigating to http://localhost:8787/index.html...')
        page.goto('http://localhost:8787/index.html')
        page.wait_for_timeout(2000)

        cache_badge = page.locator('#cacheStatus').inner_text()
        print(f'Cache badge text: "{cache_badge}"')
        assert '100% offline' not in cache_badge, 'Badge should not say 100% offline'

        print('2. Loading Bao Ha model preset...')
        page.click('#btnPresetBaoHa')
        
        page.wait_for_selector('#predict:not([disabled])', timeout=20000)
        print('Model loaded successfully.')
        page.wait_for_timeout(1000)

        print('\n3. Testing Case 0, Horizon 1 (Reference Case):')
        page.fill('#caseIndex', '0')
        page.select_option('#horizon', '1')
        page.click('#predict')
        page.wait_for_timeout(2500)

        stat_pred_0 = page.locator('#statPrediction').inner_text()
        stat_act_0 = page.locator('#statActual').inner_text()
        stat_err_0 = page.locator('#statAbsError').inner_text()
        print(f'Case 0 (H=1) -> Pred: {stat_pred_0}, Actual: {stat_act_0}, Error: {stat_err_0}')

        # Check hydrograph historical points de-normalization
        hydro_data = page.evaluate('() => window.__cuunet.lastPlottedHydrograph')
        if hydro_data and 'pointRegistry' in hydro_data:
            hist_points = [pt for pt in hydro_data['pointRegistry'] if pt.get('type') == 'history']
            if hist_points:
                val_0 = hist_points[0]['val']
                print(f'First historical lookback point (physical): {val_0:.4f} mm/d')
                assert val_0 > 0.1, f'Value should be in physical units (~0.99 mm/d), got {val_0}'

        assert stat_act_0 != 'N/A' and 'mm/d' in stat_act_0, f'Expected valid actual, got {stat_act_0}'
        assert stat_err_0 != 'N/A' and 'mm/d' in stat_err_0, f'Expected valid error, got {stat_err_0}'

        print('\n4. Testing Case 63, Horizon 7 (Missing Target Actual Case):')
        page.fill('#caseIndex', '63')
        page.select_option('#horizon', '7')
        page.click('#predict')
        page.wait_for_timeout(2500)

        stat_pred_63 = page.locator('#statPrediction').inner_text()
        stat_act_63 = page.locator('#statActual').inner_text()
        stat_err_63 = page.locator('#statAbsError').inner_text()
        print(f'Case 63 (H=7) -> Pred: {stat_pred_63}, Actual: {stat_act_63}, Error: {stat_err_63}')

        assert stat_act_63 == 'N/A', f'Expected N/A for statActual, got {stat_act_63}'
        assert stat_err_63 == 'N/A', f'Expected N/A for statAbsError, got {stat_err_63}'
        assert stat_err_63 != stat_err_0, 'statAbsError must NOT retain previous error!'

        print('\n✓ ALL ASSERTIONS PASSED PERFECTLY!')
        browser.close()

if __name__ == '__main__':
    main()
