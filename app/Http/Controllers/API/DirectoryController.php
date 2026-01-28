<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Department;
use Illuminate\Http\Request;

class DirectoryController extends Controller
{
    public function organizations(Request $request)
    {
        $items = Organization::query()
            ->orderBy('name')
            ->pluck('name')
            ->values();

        if ($items->isEmpty()) {
            $items = collect(config('directories.work_places', []));
        }

        return $items;
    }

    public function workPlaces(Request $request)
    {
        $city = $request->query('city');
        $byCity = config('directories.work_places_by_city', []);

        if ($city && isset($byCity[$city])) {
            return collect($byCity[$city]);
        }

        return collect(config('directories.work_places', []));
    }

    public function departments(Request $request)
    {
        $items = Department::query()
            ->orderBy('name')
            ->pluck('name')
            ->values();

        if ($items->isEmpty()) {
            $items = collect(config('directories.departments', []));
        }

        return $items;
    }

    public function cities(Request $request)
    {
        return collect(config('directories.cities', []));
    }

    public function educations(Request $request)
    {
        return collect(config('directories.educations', []));
    }

    public function positions(Request $request)
    {
        return collect(config('directories.positions', []));
    }

    public function categories(Request $request)
    {
        return collect(config('directories.categories', []));
    }
}