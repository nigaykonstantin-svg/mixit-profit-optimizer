-- ===========================================
-- MIXIT Organizational Structure Module
-- Migration: 005_org_structure.sql
-- Date: 2026-01-11
-- ===========================================

-- Departments
CREATE TABLE IF NOT EXISTS org_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    head_name TEXT,
    head_title TEXT,
    employee_count INTEGER DEFAULT 0,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-departments
CREATE TABLE IF NOT EXISTS org_subdepartments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES org_departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    head_name TEXT,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (from Bitrix24 export)
CREATE TABLE IF NOT EXISTS org_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES org_departments(id) ON DELETE SET NULL,
    subdepartment_id UUID REFERENCES org_subdepartments(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    bitrix_id TEXT UNIQUE,
    is_head BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals (OKR tracking)
CREATE TABLE IF NOT EXISTS org_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES org_departments(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT CHECK (goal_type IN ('revenue', 'growth', 'efficiency', 'quality')),
    priority INTEGER CHECK (priority BETWEEN 1 AND 3) DEFAULT 2,
    current_value TEXT,
    target_value TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    owner_name TEXT,
    deadline DATE,
    quarter TEXT, -- e.g., 'Q1 2026'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matrix Relations (Primary, Functional, Project connections)
CREATE TABLE IF NOT EXISTS org_matrix_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES org_departments(id) ON DELETE CASCADE NOT NULL,
    relation_type TEXT CHECK (relation_type IN ('primary', 'functional', 'project')) NOT NULL,
    connected_to TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Control for Org Module
CREATE TABLE IF NOT EXISTS org_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    role TEXT CHECK (role IN ('viewer', 'editor', 'admin')) DEFAULT 'viewer',
    department_scope UUID[] DEFAULT '{}', -- array of department IDs user can access (empty = all)
    can_manage_goals BOOLEAN DEFAULT FALSE,
    can_manage_structure BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Indexes for performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_org_employees_department ON org_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_org_goals_department ON org_goals(department_id);
CREATE INDEX IF NOT EXISTS idx_org_goals_quarter ON org_goals(quarter);
CREATE INDEX IF NOT EXISTS idx_org_matrix_department ON org_matrix_relations(department_id);
CREATE INDEX IF NOT EXISTS idx_org_subdepts_department ON org_subdepartments(department_id);

-- ===========================================
-- Row Level Security
-- ===========================================
ALTER TABLE org_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_subdepartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_matrix_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_access ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated users can read)
CREATE POLICY "org_departments_read" ON org_departments FOR SELECT USING (true);
CREATE POLICY "org_subdepartments_read" ON org_subdepartments FOR SELECT USING (true);
CREATE POLICY "org_employees_read" ON org_employees FOR SELECT USING (true);
CREATE POLICY "org_goals_read" ON org_goals FOR SELECT USING (true);
CREATE POLICY "org_matrix_read" ON org_matrix_relations FOR SELECT USING (true);
CREATE POLICY "org_access_read" ON org_access FOR SELECT USING (true);

-- Write policies (will be managed by service role key in API)
CREATE POLICY "org_departments_write" ON org_departments FOR ALL USING (true);
CREATE POLICY "org_subdepartments_write" ON org_subdepartments FOR ALL USING (true);
CREATE POLICY "org_employees_write" ON org_employees FOR ALL USING (true);
CREATE POLICY "org_goals_write" ON org_goals FOR ALL USING (true);
CREATE POLICY "org_matrix_write" ON org_matrix_relations FOR ALL USING (true);
CREATE POLICY "org_access_write" ON org_access FOR ALL USING (true);

-- ===========================================
-- Trigger for updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_org_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_departments_updated_at
    BEFORE UPDATE ON org_departments
    FOR EACH ROW EXECUTE FUNCTION update_org_updated_at();

CREATE TRIGGER org_employees_updated_at
    BEFORE UPDATE ON org_employees
    FOR EACH ROW EXECUTE FUNCTION update_org_updated_at();

CREATE TRIGGER org_goals_updated_at
    BEFORE UPDATE ON org_goals
    FOR EACH ROW EXECUTE FUNCTION update_org_updated_at();

CREATE TRIGGER org_access_updated_at
    BEFORE UPDATE ON org_access
    FOR EACH ROW EXECUTE FUNCTION update_org_updated_at();

-- ===========================================
-- Initial seed data: Departments from HTML
-- ===========================================
INSERT INTO org_departments (slug, name, head_name, head_title, employee_count, color) VALUES
    ('direction', 'Дирекция', 'Олег Пай', 'Генеральный директор', 10, 'pink'),
    ('commercial', 'Коммерческий департамент', 'Филипп Дубин', 'Коммерческий директор', 129, 'orange'),
    ('digital', 'Деп-т цифровой трансформации', 'Максим Смородинов', 'Директор ДЦТ', 89, 'teal'),
    ('marketing', 'Департамент маркетинга', 'Елена Назарова', 'Зам. ГД по маркетингу', 40, 'blue'),
    ('brand', 'Бренд-менеджмент', 'Мария Беленцова', 'Директор по бренду', 28, 'pink'),
    ('finance', 'Финансовый департамент', 'Екатерина Тубашова', 'Финансовый директор', 39, 'purple'),
    ('operations', 'Операционный департамент', 'Фарид Акаев', 'Операционный директор', 88, 'purple'),
    ('exec', 'Исполнительная дирекция', 'Наталия Субботина', 'Исполнительный директор', 154, 'purple'),
    ('procurement', 'Закупки', NULL, NULL, 16, 'teal'),
    ('lab', 'Лаборатория и сертификация', NULL, NULL, 11, 'green'),
    ('legal', 'Юридический отдел', NULL, NULL, 5, 'gray')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    head_name = EXCLUDED.head_name,
    head_title = EXCLUDED.head_title,
    employee_count = EXCLUDED.employee_count,
    color = EXCLUDED.color;

-- Subdepartments seed
INSERT INTO org_subdepartments (department_id, name, head_name, employee_count)
SELECT d.id, s.name, s.head_name, s.employee_count
FROM org_departments d
CROSS JOIN LATERAL (
    VALUES
    -- Direction
    ('direction', 'Стратегия', 'Константин Нигай', 2),
    ('direction', 'СБ', 'Валерий Ким', 5),
    -- Commercial
    ('commercial', 'Wildberries', 'Вероника Силачева', 24),
    ('commercial', 'OZON', NULL, 15),
    ('commercial', 'Контент МП', 'Алексей Суховских', 36),
    ('commercial', 'Оффлайн', 'Анна Журавская', 32),
    -- Digital
    ('digital', 'Инфраструктура', 'В. Филатов', 18),
    ('digital', 'Разработка 1С', 'А. Локшаева', 16),
    ('digital', 'AI HUB', 'Алексей Федьков', 4),
    ('digital', 'Аналитика', 'Т. Дроздова', 12),
    ('digital', 'Автоматизация', 'В. Гладкий', 16),
    -- Marketing
    ('marketing', 'INFLUENCE', 'Екатерина Сенюх', 12),
    ('marketing', 'Дизайн', 'Арина Пономарева', 11),
    ('marketing', 'SMM', 'София Собянина', 5),
    ('marketing', 'PR', NULL, 7),
    -- Brand
    ('brand', 'MIXIT', 'А. Останина', 7),
    ('brand', 'MIXITLAB', 'Н. Степанова', 6),
    ('brand', 'Разработка продуктов', NULL, 11),
    -- Finance
    ('finance', 'Бухгалтерия', 'Е. Косыч', 12),
    ('finance', 'Товарный учет', 'Данилова', 12),
    ('finance', 'Фин. контроль', NULL, 6),
    -- Operations
    ('operations', 'Производство', 'И. Андреев', 39),
    ('operations', 'Логистика', 'С. Лебедев', 28),
    ('operations', 'Качество', 'В. Брускова', 5)
) AS s(dept_slug, name, head_name, employee_count)
WHERE d.slug = s.dept_slug
ON CONFLICT DO NOTHING;

-- Matrix relations seed
INSERT INTO org_matrix_relations (department_id, relation_type, connected_to)
SELECT d.id, r.relation_type, r.connected_to
FROM org_departments d
CROSS JOIN LATERAL (
    VALUES
    ('direction', 'primary', 'Все департаменты'),
    ('commercial', 'primary', 'WB, OZON, Оффлайн'),
    ('commercial', 'functional', 'Маркетинг'),
    ('commercial', 'project', 'Оптимизация МП'),
    ('digital', 'primary', 'IT, 1С, AI HUB'),
    ('digital', 'functional', 'Все департаменты'),
    ('digital', 'project', 'StockM, Profit Optimizer'),
    ('marketing', 'primary', 'SMM, Дизайн, PR'),
    ('marketing', 'functional', 'Коммерция (контент)'),
    ('marketing', 'project', 'UGC платформа'),
    ('brand', 'primary', 'MIXIT, MIXITLAB, БАДы'),
    ('brand', 'functional', 'Лаборатория, Закупки'),
    ('finance', 'primary', 'Бухгалтерия, Контроль'),
    ('finance', 'functional', 'Все департаменты'),
    ('operations', 'primary', 'Производство, Логистика'),
    ('operations', 'functional', 'Закупки, ДЦТ'),
    ('operations', 'project', 'StockM')
) AS r(dept_slug, relation_type, connected_to)
WHERE d.slug = r.dept_slug
ON CONFLICT DO NOTHING;

-- Initial goals from HTML
INSERT INTO org_goals (department_id, title, description, goal_type, priority, current_value, target_value, progress, owner_name, deadline, quarter)
SELECT d.id, g.title, g.description, g.goal_type, g.priority, g.current_value, g.target_value, g.progress, g.owner_name, g.deadline::DATE, 'Q1 2026'
FROM org_departments d
CROSS JOIN LATERAL (
    VALUES
    ('direction', 'Рост выручки на 25%', 'Достичь 15 млрд ₽ к концу года', 'revenue', 3, '12B', '15B', 48, 'Олег Пай', '2026-12-31'),
    ('direction', 'Запуск 3 новых направлений', 'Диверсификация бизнеса', 'growth', 2, '1', '3', 33, 'Константин Нигай', '2026-06-30'),
    ('commercial', 'Доля рынка WB — 5%', 'Категория уходовой косметики', 'growth', 3, '3.2%', '5%', 64, 'Вероника Силачева', '2026-06-30'),
    ('commercial', 'Конверсия > 8%', 'Средняя конверсия карточек', 'efficiency', 2, '6.5%', '8%', 81, 'Алексей Суховских', '2026-03-31'),
    ('commercial', '25 федеральных сетей', 'Развитие FMCG-канала', 'growth', 2, '15', '25', 60, 'Анна Журавская', '2026-12-31'),
    ('digital', 'AI-аналитика продаж', 'Прогнозирование и ценообразование', 'efficiency', 3, '40%', '100%', 40, 'Алексей Федьков', '2026-06-30'),
    ('digital', 'Автоматизация склада', 'Полная интеграция WMS', 'efficiency', 2, '75%', '100%', 75, 'Владимир Гладкий', '2026-04-30'),
    ('marketing', '1000 UGC-криейторов', 'Масштабирование платформы', 'growth', 3, '250', '1000', 25, 'Екатерина Сенюх', '2026-12-31'),
    ('marketing', 'Охват 10M в месяц', 'Все социальные сети', 'growth', 2, '6.5M', '10M', 65, 'София Собянина', '2026-06-30'),
    ('brand', '50 новых SKU', 'Разработка и вывод на рынок', 'growth', 3, '18', '50', 36, 'Анастасия Останина', '2026-12-31'),
    ('finance', 'Маржинальность > 35%', 'Операционная рентабельность', 'revenue', 3, '31%', '35%', 77, 'Екатерина Тубашова', '2026-12-31'),
    ('operations', 'OOS < 2%', 'Минимизация out-of-stock', 'efficiency', 3, '4.5%', '2%', 55, 'Фарид Акаев', '2026-06-30')
) AS g(dept_slug, title, description, goal_type, priority, current_value, target_value, progress, owner_name, deadline)
WHERE d.slug = g.dept_slug
ON CONFLICT DO NOTHING;

-- Default admin access for key users
INSERT INTO org_access (user_id, role, can_manage_goals, can_manage_structure) VALUES
    ('konstantin', 'admin', true, true),
    ('oleg', 'admin', true, true),
    ('veronika', 'editor', true, false)
ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    can_manage_goals = EXCLUDED.can_manage_goals,
    can_manage_structure = EXCLUDED.can_manage_structure;
