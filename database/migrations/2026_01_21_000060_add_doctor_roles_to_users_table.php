<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'organization_role')) {
                $table->string('organization_role', 20)->default('staff')->after('position');
            }
            if (!Schema::hasColumn('users', 'department_role')) {
                $table->string('department_role', 20)->default('staff')->after('organization_role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'department_role')) {
                $table->dropColumn('department_role');
            }
            if (Schema::hasColumn('users', 'organization_role')) {
                $table->dropColumn('organization_role');
            }
        });
    }
};
