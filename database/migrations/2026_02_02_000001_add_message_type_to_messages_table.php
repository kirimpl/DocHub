<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('message_type', 20)->default('direct')->index()->after('support_ticket_id');
        });

        DB::table('messages')
            ->whereNotNull('support_ticket_id')
            ->update(['message_type' => 'support']);

        DB::table('messages')
            ->whereNull('message_type')
            ->update(['message_type' => 'direct']);
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['message_type']);
            $table->dropColumn('message_type');
        });
    }
};
