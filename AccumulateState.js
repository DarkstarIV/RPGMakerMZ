//=============================================================================
// AccumulateState.js
// ----------------------------------------------------------------------------
// (C)2016 Triacontane
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 2.5.0 2024/04/10 蓄積ステートの解除条件に「戦闘終了時に解除」がある場合、蓄積率も同時にリセットできる機能を追加
// 2.4.2 2023/02/12 プラグイン未適用のセーブデータをロードしたときエラーになる場合がある問題を修正
// 2.4.1 2022/05/25 2.4.0の修正で不要なゲージが表示される場合がある問題を修正
// 2.4.0 2022/03/18 マップ画面とステータス画面に蓄積ゲージを表示できるよう修正
// 2.3.0 2021/07/23 敵キャラに対しても蓄積ゲージを表示できる機能を追加
// 2.2.1 2021/07/16 蓄積型ステートが有効になるごとに耐性が上昇する機能を追加
// 2.2.0 2021/07/15 MZで動作するよう全面的に修正
// 2.1.0 2021/07/15 蓄積ゲージ表示の有無をスイッチで切り替えられる機能を追加
// 2.0.0 2017/05/29 蓄積率計算式を独自に指定できるよう仕様変更。運補正と必中補正の有無を設定できる機能を追加
// 1.1.1 2017/05/28 減算の結果が負の値になったときに蓄積率が減算されていた問題を修正
// 1.1.0 2017/05/28 耐性計算式を除算と減算の二つを用意しました。
// 1.0.1 2016/05/31 戦闘テスト以外で戦闘に入るとエラーになる場合がある問題を修正
// 1.0.0 2016/05/28 初版
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc 蓄積型ステートプラグイン
 * @target MZ
 * @url https://github.com/triacontane/RPGMakerMV/tree/mz_master/AccumulateState.js
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 * @author トリアコンタン
 *
 * @param GaugeImage
 * @text ゲージ画像ファイル
 * @desc Image files (img/pictures) to be used for gauge display. The empty and full gauges should be lined up vertically in a single image.
 * @default
 * @dir img/pictures/
 * @type file
 *
 * @param GaugeSwitchId
 * @text gauge indication switch
 * @desc When enabled, the gauge is displayed only when the specified switch is ON.
 * @default 0
 * @type switch
 *
 * @param AccumulateFormula
 * @text Accumulation Rate Formula
 * @desc Create your own formula to calculate the accumulation rate from the effect “State Addition” and the target “State Effectiveness”.
 * @default
 *
 * @param LuckAdjust
 * @text Luck Correction
 * @desc When turned on, the accumulation rate is corrected by luck. (Conforms to default specification)
 * @default true
 * @type boolean
 *
 * @param CertainHit
 * @text Effectiveness is ignored when a hit is certain
 * @desc When turned ON, the value of “State Addition” is directly reflected in the accumulation rate for must-have skills.
 * @default true
 * @type boolean
 *
 * @param ImmunityRate
 * @text Immunity Rate
 * @desc The resistance value each time a state is activated. Once it hits 100, the state won't activate again.
 * @default 0
 * @type number
 *
 * @param ResetAccumulateEndBattle
 * @text Reset at the end of battle
 * @desc If this value is set to true, then the accumlated stacks will reset at the end of battle.
 * @default false
 * @type boolean
 *
 * @command ACCUMULATE
 * @text Accumulate
 * @desc Increases or decreases the accumulation rate for the specified actor.
 *
 * @arg actorId
 * @text Actor ID
 * @desc Targeting actor ID. If targeting an enemy, leave at 0.
 * @default 0
 * @type actor
 *
 * @arg enemyIndex
 * @text Enemy Character Index
 * @desc Target enemy character index. If targeting an actor, leave at -1.
 * @default -1
 * @type number
 * @min -1
 *
 * @arg stateId
 * @text State ID
 * @desc Target State ID. Specify the ID of the state.
 * @default 1
 * @type state
 *
 * @arg rate
 * @text Accumulation Rate
 * @desc Accumulation rate (-100% to 100%).
 * @default 0
 * @type number
 * @min -100
 * @max 100
 *
 * @help Changes a specific state to accumulating type.
 * If you want to make the state accumulative, set the following in the memo field
 * <蓄積型>
 * <Accumulate>
 *
 * Accumulated State Values according to state addition.
 * When the accumulation rate exceeds 100% (=1.0), the target state becomes effective.
 * The formula is as follows
 *
 * Effect “Add State” * Target's “State Availability” = Accumulation Rate
 * Example: If the effect “State Addition” is 80% (0.8) and the target's State Effectiveness is 50% (0.5)
 * 0.8 * 0.5 = 0.4 # Accumulation rate is 40% (0.4)
 *
 * In addition, a separate accumulation rate calculation formula can be specified as a function for advanced users.
 * The following variables can be used in the formula
 *
 * a : Setting value of the effect “State Addition”.
 * b : Target “State Validity” setting value
 *
 * Example of specifying an accumulation rate calculation formula
 * a - (1.0 - b)
 *
 * Example: If the effect “State Addition” is 80% (0.8) and the target's State Effectiveness is 50% (0.5)
 * 0.8 - (1.0 - 0.5) = 0.3 # Accumulation rate is 30% (0.3)
 *
 * If the accumulation rate is negative, it is calculated as “0”. If a buzzer sounds during execution,
 * There is a problem with the script description.
 * Press F8 to open the Developer Tools and review the contents.
 *
 * In addition, the accumulation rate is reset by “state release”.
 *
 * Only one state can be specified and displayed as a gauge on the battle screen.
 * To use this feature, set the following in the actor's notes field.
 * <Storage Gauge State:3> // Display the accumulating state ID “3” as a gauge.
 * <Storage Gauge X:600> // X coordinate of the gauge.
 * <Storage Gauge Y:400> // Y coordinate of the gauge.
 *
 * If you want to display the gauge on the map screen or status screen, specify the coordinates.
 * <accumulated map gauge X:600> // X coordinate of the gauge on the map screen.
 * <stored map gauge Y:400> // Y coordinate of the gauge on the map screen.
 * <Stored Status Gauge X:600> // X coordinate of the gauge on the status screen.
 * <Stored Status Gauge Y:400> // Y coordinate of the gauge on the status screen.
 *
 * The gauge image is the one specified by the parameter.
 *
 * Terms of Use:
 * You may modify and redistribute the materials without permission of the author, and there are no restrictions on the form of use (commercial, 18-restricted use, etc.).
 * No restrictions on the type of use (commercial, 18-content use, etc.).
 * This plugin is now yours.
 */

(()=>{
    'use strict';
    const script = document.currentScript;
    const param = PluginManagerEx.createParameter(script);

    PluginManagerEx.registerCommand(script, 'ACCUMULATE', args => {
        const actor = $gameActors.actor(args.actorId);
        if (actor) {
            actor.accumulateState(args.stateId, args.rate / 100);
        }
        const enemy = $gameTroop.members()[args.enemyIndex];
        if (enemy) {
            enemy.accumulateState(args.stateId, args.rate / 100);
        }
    });

    //=============================================================================
    // Game_BattlerBase
    //  Manage the amount of state accumulation.
    //=============================================================================
    Game_BattlerBase.prototype.clearStateAccumulationsIfNeed = function () {
        if (!this._stateAccumulations) {
            this._stateAccumulations = {};
        }
        if (!this._stateImmunity) {
            this._stateImmunity = {};
        }
    };

    const _Game_BattlerBase_clearStates = Game_BattlerBase.prototype.clearStates;
    Game_BattlerBase.prototype.clearStates = function () {
        _Game_BattlerBase_clearStates.apply(this, arguments);
        this.clearStateAccumulationsIfNeed();
    };

    const _Game_BattlerBase_eraseState = Game_BattlerBase.prototype.eraseState;
    Game_BattlerBase.prototype.eraseState = function (stateId) {
        _Game_BattlerBase_eraseState.apply(this, arguments);
        this.clearStateAccumulationsIfNeed();
        delete this._stateAccumulations[stateId];
    };

    const _Game_Battler_removeState = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function (stateId) {
        _Game_Battler_removeState.apply(this, arguments);
        this.clearStateAccumulationsIfNeed();
        delete this._stateAccumulations[stateId];
    };

    const _Game_BattlerBase_attackStates = Game_BattlerBase.prototype.attackStates;
    Game_BattlerBase.prototype.attackStates = function (accumulateFlg) {
        if (arguments.length === 0) accumulateFlg = false;
        const states = _Game_BattlerBase_attackStates.apply(this, arguments);
        return states.filter(function (stateId) {
            return BattleManager.isStateAccumulate(stateId) === accumulateFlg;
        }.bind(this));
    };

    Game_Battler.prototype.accumulateState = function (stateId, value) {
        this.clearStateAccumulationsIfNeed();
        if (BattleManager.isStateAccumulate(stateId)) {
            this._stateAccumulations[stateId] = (this._stateAccumulations[stateId] || 0) + value;
            if (!this.isStateAffected(stateId) && this._stateAccumulations[stateId] >= 1.0) {
                this.addState(stateId);
                this._stateImmunity[stateId] = (this._stateImmunity[stateId] || 0) + 1;
                return true;
            }
        }
        return false;
    };

    const _Game_Battler_removeBattleStates = Game_Battler.prototype.removeBattleStates;
    Game_Battler.prototype.removeBattleStates = function() {
        _Game_Battler_removeBattleStates.apply(this, arguments);
        if (param.ResetAccumulateEndBattle) {
            for (const stateId in this._stateAccumulations) {
                const state = $dataStates[stateId];
                if (state.removeAtBattleEnd && this._stateAccumulations[stateId] > 0) {
                    this._stateAccumulations[stateId] = 0
                }
            }
        }
    };

    Game_BattlerBase.prototype.getStateImmunity = function (stateId) {
        return (this._stateImmunity[stateId] * param.ImmunityRate / 100) || 0;
    };

    Game_BattlerBase.prototype.getStateAccumulation = function (stateId) {
        return this._stateAccumulations[stateId] || 0;
    };

    Game_BattlerBase.prototype.getGaugeStateAccumulation = function () {
        return this.getStateAccumulation(this.getGaugeStateId());
    };

    Game_BattlerBase.prototype.getGaugeX = function () {
        return this.getGaugeInfo(SceneManager.findAccumulateGaugeTagX());
    };

    Game_BattlerBase.prototype.getGaugeY = function () {
        return this.getGaugeInfo(SceneManager.findAccumulateGaugeTagY());
    };

    Game_BattlerBase.prototype.getGaugeStateId = function () {
        return this.getGaugeInfo(['Stored Gauge State', 'AccumulateGaugeState']);
    };

    Game_BattlerBase.prototype.getGaugeInfo = function (names) {
        return PluginManagerEx.findMetaValue(this.getData(), names);
    };

    Game_BattlerBase.prototype.getData = function () {
        return null;
    };

    Game_Actor.prototype.getData = function () {
        return this.actor();
    };

    Game_Enemy.prototype.getData = function () {
        return this.enemy();
    };

    const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _Game_System_onAfterLoad.apply(this, arguments);
        $gameActors.clearStateAccumulationsIfNeed();
    };

    Game_Actors.prototype.clearStateAccumulationsIfNeed = function() {
        this._data.forEach(actor => {
            if (actor) {
                actor.clearStateAccumulationsIfNeed();
            }
        });
    };

    SceneManager.findAccumulateGaugeTagX = function() {
        if (this._scene instanceof Scene_Map) {
            return ['Accumulation Map Gauge X', 'AccumulateMapGaugeX'];
        }
        if (this._scene instanceof Scene_Status) {
            return ['Accumulated Status Gauge X', 'AccumulateStatusGaugeX'];
        }
        return ['Accumulation Gauge X', 'AccumulateGaugeX'];
    };

    SceneManager.findAccumulateGaugeTagY = function() {
        if (this._scene instanceof Scene_Map) {
            return ['Accumulated map gauge Y', 'AccumulateMapGaugeY'];
        }
        if (this._scene instanceof Scene_Status) {
            return ['Accumulated Status Gauge Y', 'AccumulateStatusGaugeY'];
        }
        return ['Accumulation gauge Y', 'AccumulateGaugeY'];
    };

    //=============================================================================
    // Game_Action
    //  Increases state accumulation by action.
    //=============================================================================
    const _Game_Action_itemEffectAddAttackState = Game_Action.prototype.itemEffectAddAttackState;
    Game_Action.prototype.itemEffectAddAttackState = function (target, effect) {
        _Game_Action_itemEffectAddAttackState.apply(this, arguments);
        this.subject().attackStates(true).forEach(stateId => {
            let accumulation = effect.value1 * this.subject().attackStatesRate(stateId);
            accumulation = this.applyResistanceForAccumulateState(accumulation, target, stateId);
            const result = target.accumulateState(stateId, accumulation);
            if (result) this.makeSuccess(target);
        });
    };

    const _Game_Action_itemEffectAddNormalState = Game_Action.prototype.itemEffectAddNormalState;
    Game_Action.prototype.itemEffectAddNormalState = function (target, effect) {
        if (BattleManager.isStateAccumulate(effect.dataId)) {
            let accumulation = effect.value1;
            if (!this.isCertainHit() || !param.CertainHit) {
                accumulation = this.applyResistanceForAccumulateState(accumulation, target, effect.dataId);
            }
            const result = target.accumulateState(effect.dataId, accumulation);
            if (result) this.makeSuccess(target);
        } else {
            _Game_Action_itemEffectAddNormalState.apply(this, arguments);
        }
    };

    Game_Action.prototype.applyResistanceForAccumulateState = function (effectValue, target, stateId) {
        if (param.AccumulateFormula) {
            const a = effectValue;
            const b = target.stateRate(stateId);
            try {
                effectValue = eval(param.AccumulateFormula);
            } catch (e) {
                SoundManager.playBuzzer();
                console.warn('Script Error : ' + param.AccumulateFormula);
                console.warn(e.stack);
            }
        } else {
            effectValue *= target.stateRate(stateId);
        }
        if (param.LuckAdjust) {
            effectValue *= this.lukEffectRate(target);
        }
        effectValue *= (1.0 - target.getStateImmunity(stateId));
        return effectValue.clamp(0.0, 1.0);
    };

    //=============================================================================
    // BattleManager
    //  Determines if the state is a storing type state.
    //=============================================================================
    BattleManager.isStateAccumulate = function (stateId) {
        return stateId > 0 && !!PluginManagerEx.findMetaValue($dataStates[stateId], ['accumulator', 'Accumulate']);
    };

    //=============================================================================
    // Scene_Base
    //  Create a state gauge.
    //=============================================================================
    Scene_Battle.prototype.createAccumulateState = function (detailMenu) {
        Scene_Base.prototype.createAccumulateState.call(this, detailMenu);
        for (let i = 0, n = $gameTroop.members().length; i < n; i++) {
            const sprite = new Sprite_AccumulateState(i, $gameTroop, false);
            this.addChild(sprite);
        }
    };

    Scene_Base.prototype.createAccumulateState = function (detailMenu) {
        for (let i = 0, n = $gameParty.members().length; i < n; i++) {
            const sprite = new Sprite_AccumulateState(i, $gameParty, detailMenu);
            this.addChild(sprite);
        }
    };

    const _Scene_Battle_createSpriteset = Scene_Battle.prototype.createSpriteset;
    Scene_Battle.prototype.createSpriteset = function () {
        _Scene_Battle_createSpriteset.apply(this, arguments);
        this.createAccumulateState(false);
    };

    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function () {
        _Scene_Map_createSpriteset.apply(this, arguments);
        this.createAccumulateState(false);
    };

    const _Scene_Status_create = Scene_Status.prototype.create;
    Scene_Status.prototype.create = function() {
        _Scene_Status_create.apply(this, arguments);
        this.createAccumulateState(true);
    };

    //=============================================================================
    // Sprite_AccumulateState
    //  This is a sprite for displaying state accumulation.
    //=============================================================================
    function Sprite_AccumulateState() {
        this.initialize.apply(this, arguments);
    }

    Sprite_AccumulateState.prototype = Object.create(Sprite.prototype);
    Sprite_AccumulateState.prototype.constructor = Sprite_AccumulateState;

    Sprite_AccumulateState.prototype.initialize = function (index, unit, detailMenu) {
        this._index = index;
        this._battler = null;
        this._unit = unit;
        this._rate = null;
        this._detailMenu = detailMenu;
        Sprite.prototype.initialize.call(this);
        this.create();
    };

    Sprite_AccumulateState.prototype.getBattler = function () {
        return this._unit.members()[this._index];
    };

    Sprite_AccumulateState.prototype.create = function () {
        this.bitmap = ImageManager.loadPicture(param.GaugeImage);
        this.createGaugeSprite();
        this.bitmap.addLoadListener(this.onLoadBitmap.bind(this));
        this.visible = false;
    };

    Sprite_AccumulateState.prototype.createGaugeSprite = function () {
        this._gaugeSprite = new Sprite();
        this._gaugeSprite.bitmap = this.bitmap;
        this.addChild(this._gaugeSprite);
    };

    Sprite_AccumulateState.prototype.onLoadBitmap = function () {
        const height = this.bitmap.height / 2;
        this.setFrame(0, height, this.bitmap.width, height);
        this._gaugeSprite.setFrame(0, 0, this.bitmap.width, height);
    };

    Sprite_AccumulateState.prototype.update = function () {
        const battler = this.getBattler();
        if (!battler) return;
        if (this._battler !== battler) {
            this._battler = battler;
        }
        this.updateVisibility();
        if (this.visible) {
            this.updatePosition();
            this.updateRate();
        }
    };

    Sprite_AccumulateState.prototype.updateVisibility = function () {
        this.visible = true;
        const stateId = this._battler.getGaugeStateId();
        if (!stateId) {
            this.visible = false;
        }
        if (param.GaugeSwitchId && !$gameSwitches.value(param.GaugeSwitchId)) {
            this.visible = false;
        }
        if (this._detailMenu && $gameParty.menuActor() !== this._battler) {
            this.visible = false;
        }
    };

    Sprite_AccumulateState.prototype.updateRate = function () {
        const rate = Math.min(this._battler.getGaugeStateAccumulation(), 1.0);
        if (rate !== this._rate) {
            this._rate = rate;
            this.bitmap.addLoadListener(function () {
                this._gaugeSprite.setFrame(0, 0, this.bitmap.width * rate, this.bitmap.height / 2);
            }.bind(this));
        }
    };

    Sprite_AccumulateState.prototype.updatePosition = function () {
        this.x = this._battler.getGaugeX();
        this.y = this._battler.getGaugeY();
    };
})();

