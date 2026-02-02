@extends('layouts.app')

@section('content')
<div class="colleagues-page">
    <div class="colleagues-panel requests-panel">
        <div class="colleagues-panel-header requests-header">
            <h2>Заявки в друзья</h2>
            <div class="colleagues-panel-actions">
                <button class="ghost" id="declineAllBtn">Отклонить все</button>
                <button class="primary" id="acceptAllBtn">Принять все</button>
            </div>
        </div>
        <div class="colleagues-requests" id="colleaguesRequests"></div>
    </div>

    <div class="colleagues-panel sent-panel">
        <div class="colleagues-panel-header sent-header">
            <h2>Отправленные заявки</h2>
        </div>
        <div class="colleagues-requests" id="colleaguesSent"></div>
    </div>

    <div class="colleagues-panel friends-panel">
        <div class="colleagues-panel-header friends-header">
            <h2>Список друзей</h2>
        </div>
        <div class="colleagues-friends" id="colleaguesFriends"></div>
    </div>
</div>
@endsection