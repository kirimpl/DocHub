<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('posts', 'organization_name')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->string('organization_name')->nullable()->after('is_global');
            });
        }

        if (Schema::hasTable('posts') && Schema::hasTable('users') && Schema::hasColumn('users', 'work_place')) {
            DB::statement('UPDATE posts SET organization_name = (SELECT work_place FROM users WHERE users.id = posts.user_id) WHERE organization_name IS NULL');
        }
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('organization_name');
        });
    }
};
