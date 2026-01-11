-- ============================================
-- МИГРАЦИЯ КАТЕГОРИЙ: English → Russian
-- Запустить в Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================

-- =============================================
-- ЧАСТЬ 1: wb_category_config (настройки категорий)
-- =============================================

-- Обновляем английские названия на русские
UPDATE wb_category_config SET category = 'Уход за лицом', updated_at = NOW() WHERE category = 'FACE';
UPDATE wb_category_config SET category = 'Уход за волосами', updated_at = NOW() WHERE category = 'HAIR';
UPDATE wb_category_config SET category = 'Уход за телом', updated_at = NOW() WHERE category = 'BODY';
UPDATE wb_category_config SET category = 'Макияж', updated_at = NOW() WHERE category = 'MAKEUP';

-- Если таблица пустая - создаём дефолтные записи
INSERT INTO wb_category_config (category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days)
SELECT 'Макияж', 30, 3.0, 4.0, 2, 25, 7, 60
WHERE NOT EXISTS (SELECT 1 FROM wb_category_config WHERE category = 'Макияж');

INSERT INTO wb_category_config (category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days)
SELECT 'Уход за волосами', 22, 2.0, 2.5, 4, 18, 14, 90
WHERE NOT EXISTS (SELECT 1 FROM wb_category_config WHERE category = 'Уход за волосами');

INSERT INTO wb_category_config (category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days)
SELECT 'Уход за лицом', 25, 2.5, 3.0, 3, 20, 10, 120
WHERE NOT EXISTS (SELECT 1 FROM wb_category_config WHERE category = 'Уход за лицом');

INSERT INTO wb_category_config (category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days)
SELECT 'Уход за телом', 20, 1.8, 2.0, 5, 15, 14, 100
WHERE NOT EXISTS (SELECT 1 FROM wb_category_config WHERE category = 'Уход за телом');

-- =============================================
-- ЧАСТЬ 2: sku_catalog (категории товаров)
-- =============================================

-- Обновляем английские названия на русские в sku_catalog
UPDATE sku_catalog SET category = 'Уход за лицом' WHERE UPPER(category) = 'FACE';
UPDATE sku_catalog SET category = 'Уход за волосами' WHERE UPPER(category) = 'HAIR';
UPDATE sku_catalog SET category = 'Уход за телом' WHERE UPPER(category) = 'BODY';
UPDATE sku_catalog SET category = 'Макияж' WHERE UPPER(category) = 'MAKEUP';

-- =============================================
-- ЧАСТЬ 3: ПРОВЕРКА РЕЗУЛЬТАТОВ
-- =============================================

-- Проверяем wb_category_config
SELECT 'wb_category_config' as table_name, category, min_margin_pct, price_step_pct, stock_critical_days, stock_overstock_days
FROM wb_category_config 
ORDER BY category;

-- Проверяем распределение категорий в sku_catalog
SELECT 'sku_catalog' as table_name, category, COUNT(*) as count 
FROM sku_catalog 
GROUP BY category 
ORDER BY count DESC;
