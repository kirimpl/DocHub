@extends('layouts.app')

@section('content')
    <main class="main">
        <div class="column-center">
            <section class="meetings-page">
                <header class="meetings-header">
                    <div class="meetings-title">
                        <h2>Собрания организации</h2>
                        <p>Текущие собрания в вашей организации</p>
                    </div>
                    <div class="meetings-actions">
                        <input type="text" id="meetingsSearch" placeholder="Поиск собраний">
                    </div>
                </header>

                <div id="meetingsGrid" class="meetings-grid"></div>
                <div id="meetingsEmpty" class="meetings-empty" style="display: none;">
                    Сейчас нет активных собраний.
                </div>
            </section>
        </div>
    </main>
@endsection
