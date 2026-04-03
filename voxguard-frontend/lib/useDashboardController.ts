"use client";

import { useReducer } from "react";

import {
    type DashboardController,
    type DashboardDependencies,
    dashboardCommandFactory,
    dashboardTransition,
    initialDashboardState,
} from "@/lib/dashboard-command";

export function useDashboardController(
    deps: DashboardDependencies
): DashboardController {
    const [state, send] = useReducer(
        dashboardTransition,
        initialDashboardState
    );

    const actions = dashboardCommandFactory.create({
        deps,
        state,
        send,
    });

    return {
        ...state,
        ...actions,
    };
}