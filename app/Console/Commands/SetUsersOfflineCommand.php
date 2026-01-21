<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SetUsersOfflineCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:set-offline';

    protected $description = 'Set users offline if they have not been active for 5 minutes';

    public function handle()
    {
        \App\Jobs\SetUsersOffline::dispatch();
        $this->info('SetUsersOffline job dispatched.');
    }
}
