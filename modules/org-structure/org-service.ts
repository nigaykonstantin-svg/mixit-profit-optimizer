// Org Structure Service - API calls to Supabase

import { createClient } from '@supabase/supabase-js';
import type { Department, Goal, CreateGoalData, UpdateGoalData, Subdepartment, MatrixConnection } from './types';

// Get Supabase client
function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
    }

    return createClient(supabaseUrl, supabaseKey);
}

// Transform snake_case to camelCase
function transformDepartment(row: any): Omit<Department, 'subdepartments' | 'connections' | 'goals'> {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        headName: row.head_name,
        headTitle: row.head_title,
        employeeCount: row.employee_count,
        color: row.color,
    };
}

function transformSubdepartment(row: any): Subdepartment {
    return {
        id: row.id,
        departmentId: row.department_id,
        name: row.name,
        headName: row.head_name,
        employeeCount: row.employee_count,
    };
}

function transformConnection(row: any): MatrixConnection {
    return {
        id: row.id,
        departmentId: row.department_id,
        relationType: row.relation_type,
        connectedTo: row.connected_to,
        description: row.description,
    };
}

function transformGoal(row: any): Goal {
    return {
        id: row.id,
        departmentId: row.department_id,
        title: row.title,
        description: row.description,
        goalType: row.goal_type,
        priority: row.priority,
        currentValue: row.current_value,
        targetValue: row.target_value,
        progress: row.progress,
        ownerName: row.owner_name,
        deadline: row.deadline,
        quarter: row.quarter,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Fetch all departments with their related data
export async function fetchDepartments(): Promise<Department[]> {
    const supabase = getSupabase();

    // Fetch all data in parallel
    const [deptResult, subdeptResult, connResult, goalsResult] = await Promise.all([
        supabase.from('org_departments').select('*').order('employee_count', { ascending: false }),
        supabase.from('org_subdepartments').select('*'),
        supabase.from('org_matrix_relations').select('*'),
        supabase.from('org_goals').select('*').order('priority', { ascending: false }),
    ]);

    if (deptResult.error) throw deptResult.error;
    if (subdeptResult.error) throw subdeptResult.error;
    if (connResult.error) throw connResult.error;
    if (goalsResult.error) throw goalsResult.error;

    // Group subdepartments, connections, and goals by department
    const subdeptsByDept = new Map<string, Subdepartment[]>();
    const connsByDept = new Map<string, MatrixConnection[]>();
    const goalsByDept = new Map<string, Goal[]>();

    subdeptResult.data.forEach(row => {
        const subdept = transformSubdepartment(row);
        const existing = subdeptsByDept.get(subdept.departmentId) || [];
        subdeptsByDept.set(subdept.departmentId, [...existing, subdept]);
    });

    connResult.data.forEach(row => {
        const conn = transformConnection(row);
        const existing = connsByDept.get(conn.departmentId) || [];
        connsByDept.set(conn.departmentId, [...existing, conn]);
    });

    goalsResult.data.forEach(row => {
        const goal = transformGoal(row);
        const existing = goalsByDept.get(goal.departmentId) || [];
        goalsByDept.set(goal.departmentId, [...existing, goal]);
    });

    // Combine all data
    return deptResult.data.map(row => {
        const dept = transformDepartment(row);
        return {
            ...dept,
            subdepartments: subdeptsByDept.get(dept.id) || [],
            connections: connsByDept.get(dept.id) || [],
            goals: goalsByDept.get(dept.id) || [],
        };
    });
}

// Fetch goals for a specific department
export async function fetchGoalsByDepartment(departmentId: string): Promise<Goal[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('org_goals')
        .select('*')
        .eq('department_id', departmentId)
        .order('priority', { ascending: false });

    if (error) throw error;
    return data.map(transformGoal);
}

// Create a new goal
export async function createGoal(data: CreateGoalData): Promise<Goal> {
    const supabase = getSupabase();

    const { data: result, error } = await supabase
        .from('org_goals')
        .insert({
            department_id: data.departmentId,
            title: data.title,
            description: data.description,
            goal_type: data.goalType,
            priority: data.priority,
            current_value: data.currentValue,
            target_value: data.targetValue,
            owner_name: data.ownerName,
            deadline: data.deadline,
            progress: 0,
            quarter: 'Q1 2026',
        })
        .select()
        .single();

    if (error) throw error;
    return transformGoal(result);
}

// Update an existing goal
export async function updateGoal(data: UpdateGoalData): Promise<Goal> {
    const supabase = getSupabase();

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.goalType !== undefined) updateData.goal_type = data.goalType;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.currentValue !== undefined) updateData.current_value = data.currentValue;
    if (data.targetValue !== undefined) updateData.target_value = data.targetValue;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;

    const { data: result, error } = await supabase
        .from('org_goals')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

    if (error) throw error;
    return transformGoal(result);
}

// Delete a goal
export async function deleteGoal(goalId: string): Promise<void> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('org_goals')
        .delete()
        .eq('id', goalId);

    if (error) throw error;
}

// Update goal progress only
export async function updateGoalProgress(goalId: string, progress: number): Promise<Goal> {
    return updateGoal({ id: goalId, progress: Math.max(0, Math.min(100, progress)) });
}
