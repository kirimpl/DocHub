<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = Organization::query()->select(['id', 'name']);
        $search = trim((string) $request->query('q', ''));
        if ($search !== '') {
            $query->where('name', 'like', '%' . $search . '%');
        }

        return $query->orderBy('name')->limit(50)->get();
    }
}
