<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_groups', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_groups', 'type')) {
                $table->string('type', 20)->default('custom')->after('name');
            }
            if (!Schema::hasColumn('chat_groups', 'organization_name')) {
                $table->string('organization_name')->nullable()->after('type');
            }
            if (!Schema::hasColumn('chat_groups', 'department_name')) {
                $table->string('department_name')->nullable()->after('organization_name');
            }
            if (!Schema::hasColumn('chat_groups', 'is_system')) {
                $table->boolean('is_system')->default(false)->after('department_name');
            }
        });

        Schema::table('chat_group_members', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_group_members', 'role')) {
                $table->string('role', 20)->default('member')->after('user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('chat_group_members', function (Blueprint $table) {
            if (Schema::hasColumn('chat_group_members', 'role')) {
                $table->dropColumn('role');
            }
        });

        Schema::table('chat_groups', function (Blueprint $table) {
            if (Schema::hasColumn('chat_groups', 'is_system')) {
                $table->dropColumn('is_system');
            }
            if (Schema::hasColumn('chat_groups', 'department_name')) {
                $table->dropColumn('department_name');
            }
            if (Schema::hasColumn('chat_groups', 'organization_name')) {
                $table->dropColumn('organization_name');
            }
            if (Schema::hasColumn('chat_groups', 'type')) {
                $table->dropColumn('type');
            }
        });
    }
};
