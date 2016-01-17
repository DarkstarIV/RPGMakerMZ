//=============================================================================
// PictureAnimation.js
// ----------------------------------------------------------------------------
// Copyright (c) 2015 Triacontane
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.2.1 2016/01/16 同じ画像を指定してピクチャ表示→アニメーション準備→ピクチャ表示の順で実行した
//                  場合にエラーが発生する現象の修正
// 1.2.0 2016/01/04 セルのパターンを自由に指定できる機能を追加
//                  セルの最大数を100から200に拡大
// 1.1.2 2015/12/24 クロスフェードによる画像切替に対応しました
// 1.1.1 2015/12/21 ピクチャのファイル名を連番方式で指定できる機能を追加
//                  アニメーションの強制終了の機能を追加
// 1.0.0 2015/12/19 初版
// ----------------------------------------------------------------------------
// [Blog]   : http://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc ピクチャのアニメーションプラグイン
 * @author トリアコンタン
 * 
 * @help 指定したフレーム間隔でピクチャをアニメーションします。
 * アニメーションしたいセル画像（※）を用意の上
 * 以下のコマンドを入力してください。
 *
 * 1. ピクチャのアニメーション準備（プラグインコマンド）
 * 2. ピクチャの表示（通常のイベントコマンド）
 * 3. ピクチャのアニメーション開始（プラグインコマンド）
 * 4. ピクチャのアニメーション終了（プラグインコマンド）
 *
 * ※配置方法は以下の3通りがあります。
 *  縦　：セルを縦に並べて全体を一つのファイルにします。
 *  横　：セルを横に並べて全体を一つのファイルにします。
 *  連番：連番のセル画像を複数用意します。(original部分は任意の文字列)
 *   original00.png(ピクチャの表示で指定するオリジナルファイル)
 *   original01.png
 *   original02.png...
 *
 * プラグインコマンド詳細
 *  イベントコマンド「プラグインコマンド」から実行。
 *  （パラメータの間は半角スペースで区切る）
 *
 *  PA_INIT or
 *  ピクチャのアニメーション準備 [セル数] [フレーム数] [セル配置方法] [フェード時間]
 *  　このコマンドの次に実行される「ピクチャの表示」をアニメーション対象にします。
 *  　セル数　　　：アニメーションするセル画の数（最大200枚）
 *  　フレーム数　：アニメーションする間隔のフレーム数（最低でも1を設定してください）
 *  　セル配置方向：セルの配置（縦 or 横 or 連番）
 *  　フェード時間：画像切替に掛かるフレーム数（0にするとフェードせず一瞬で切り替わります）
 *  使用例：PA_INIT 4 10 連番 20
 *
 *  PA_START or
 *  ピクチャのアニメーション開始 [ピクチャ番号] [アニメーションタイプ] [カスタムパターン配列]
 *  　指定したピクチャ番号のピクチャをアニメーションを開始します。
 *  　一周するとアニメーションは自動で止まります。
 *
 *  　アニメーションのタイプは以下の3パターンがあります。
 *  　　例：セル数が 4 の場合
 *  　　　タイプ1: 1→2→3→4→1→2→3→4...
 *  　　　タイプ2: 1→2→3→4→3→2→1→2...
 *  　　　タイプ3: 好きな順番を配列で指定（セルの最小値は 1 です）
 *  使用例：PA_START 1 2
 *  　　　　PA_START 1 3 [1,2,1,3,1,4]
 *
 *  PA_START_LOOP or
 *  ピクチャのループアニメーション開始 [ピクチャ番号] [アニメーションタイプ] [カスタムパターン配列]
 *  　指定したピクチャ番号のピクチャをアニメーションを開始します。
 *  　明示的に終了するまでアニメーションが続きます。
 *  使用例：PA_START_LOOP 1 2
 *  　　　　PA_START_LOOP 1 3 [1,2,1,3,1,4]
 *
 *  PA_STOP or
 *  ピクチャのアニメーション終了 [ピクチャ番号]
 *  　指定したピクチャ番号のピクチャをアニメーションを終了します。
 *  　一番上のセルに戻った時点でアニメーションが止まります。
 *  使用例：PA_STOP 1
 *
 *  PA_STOP_FORCE or
 *  ピクチャのアニメーション強制終了 [ピクチャ番号]
 *  　指定したピクチャ番号のピクチャをアニメーションを終了します。
 *  　現在表示しているセルでアニメーションが止まります。
 *  使用例：PA_STOP_FORCE 1
 *
 *  PA_SET_CELL or
 *  ピクチャのアニメーションセル設定 [ピクチャ番号] [セル番号] [ウェイトあり]
 *  　アニメーションのセルを直接設定します。（セルの最小値は 1 です）
 *  　任意のタイミングでアニメーションしたい場合に有効です。
 *  　ウェイトありを設定すると、クロスフェード中はイベントの実行を待機します。
 *  使用例：PA_SET_CELL 1 3 ウェイトあり
 *
 *  PA_PROG_CELL or
 *  ピクチャのアニメーションセル進行 [ピクチャ番号] [ウェイトあり]
 *  　アニメーションのセルをひとつ先に進めます。
 *  　任意のタイミングでアニメーションしたい場合に有効です。
 *  　ウェイトありを設定すると、クロスフェード中はイベントの実行を待機します。
 *  使用例：PA_PROG_CELL 1 ウェイトあり
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 */
(function () {
    'use strict';

    //=============================================================================
    // ローカル関数
    //  プラグインパラメータやプラグインコマンドパラメータの整形やチェックをします
    //=============================================================================
    var getCommandName = function (command) {
        return (command || '').toUpperCase();
    };

    var getArgArrayString = function (args, upperFlg) {
        var values = getArgString(args, upperFlg);
        return (values || '').split(',');
    };

    var getArgArrayNumber = function (args, min, max) {
        var values = getArgArrayString(args, false);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        for (var i = 0; i < values.length; i++) values[i] = (parseInt(values[i], 10) || 0).clamp(min, max);
        return values;
    };

    var getArgString = function (arg, upperFlg) {
        arg = convertEscapeCharacters(arg);
        return upperFlg ? arg.toUpperCase() : arg;
    };

    var getArgNumber = function (arg, min, max) {
        if (arguments.length <= 2) min = -Infinity;
        if (arguments.length <= 3) max = Infinity;
        return (parseInt(convertEscapeCharacters(arg), 10) || 0).clamp(min, max);
    };

    var convertEscapeCharacters = function(text) {
        if (text == null) text = '';
        var window = SceneManager._scene._windowLayer.children[0];
        return window ? window.convertEscapeCharacters(text) : text;
    };

    //=============================================================================
    // Game_Interpreter
    //  プラグインコマンドを追加定義します。
    //=============================================================================
    var _Game_Interpreter_pluginCommand      = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        try {
            this.pluginCommandPictureAnimation.call(this, command, args);
        } catch (e) {
            if ($gameTemp.isPlaytest() && Utils.isNwjs()) {
                var window = require('nw.gui').Window.get();
                var devTool = window.showDevTools();
                devTool.moveTo(0, 0);
                devTool.resizeTo(Graphics.width, Graphics.height);
                window.focus();
            }
            console.log('プラグインコマンドの実行中にエラーが発生しました。');
            console.log('- コマンド名 　: ' + command);
            console.log('- コマンド引数 : ' + args);
            console.log('- エラー原因   : ' + e.toString());
            throw e;
        }
    };

    Game_Interpreter.prototype.pluginCommandPictureAnimation = function (command, args) {
        var pictureNum, animationType, picture, cellNumber, frameNumber, direction, fadeDuration, wait, customArray;
        switch (getCommandName(command)) {
            case 'PA_INIT' :
            case 'ピクチャのアニメーション準備':
                cellNumber   = getArgNumber(args[0], 1, 200);
                frameNumber  = getArgNumber(args[1], 1, 9999);
                direction    = getArgString(args[2], true) || '縦';
                fadeDuration = getArgNumber(args[3], 0, 9999) || 0;
                $gameScreen.setPicturesAnimation(cellNumber, frameNumber, direction, fadeDuration);
                break;
            case 'PA_START' :
            case 'ピクチャのアニメーション開始':
                pictureNum     = getArgNumber(args[0], 1, 100);
                animationType  = getArgNumber(args[1], 1, 3);
                customArray    = getArgArrayNumber(args[2], 1, 200);
                picture        = $gameScreen.picture($gameScreen.realPictureId(pictureNum));
                if (picture) picture.startAnimation(animationType, false, customArray);
                break;
            case 'PA_START_LOOP' :
            case 'ピクチャのループアニメーション開始':
                pictureNum     = getArgNumber(args[0], 1, 100);
                animationType  = getArgNumber(args[1], 1, 3);
                customArray    = getArgArrayNumber(args[2], 1, 200);
                picture        = $gameScreen.picture($gameScreen.realPictureId(pictureNum));
                if (picture) picture.startAnimation(animationType, true, customArray);
                break;
            case 'PA_STOP' :
            case 'ピクチャのアニメーション終了':
                pictureNum    = getArgNumber(args[0], 1, 100);
                picture       = $gameScreen.picture($gameScreen.realPictureId(pictureNum));
                if (picture) picture.stopAnimation(false);
                break;
            case 'PA_STOP_FORCE' :
            case 'ピクチャのアニメーション強制終了':
                pictureNum    = getArgNumber(args[0], 1, 100);
                picture       = $gameScreen.picture($gameScreen.realPictureId(pictureNum));
                if (picture) picture.stopAnimation(true);
                break;
            case 'PA_SET_CELL' :
            case 'ピクチャのアニメーションセル設定':
                pictureNum    = getArgNumber(args[0], 1, 100);
                cellNumber    = getArgNumber(args[1], 1, 200);
                wait          = getArgString(args[2]);
                picture       = $gameScreen.picture($gameScreen.realPictureId(pictureNum));
                if (picture) {
                    if (wait === 'ウェイトあり' || wait.toUpperCase() === 'WAIT') this.wait(picture._fadeDuration);
                    picture.cell = cellNumber;
                }
                break;
            case 'PA_PROG_CELL' :
            case 'ピクチャのアニメーションセル進行':
                pictureNum    = getArgNumber(args[0], 1, 100);
                wait          = getArgString(args[1]);
                picture       = $gameScreen.picture($gameScreen.realPictureId(pictureNum));
                if (picture) {
                    if (wait === 'ウェイトあり' || wait.toUpperCase() === 'WAIT') this.wait(picture._fadeDuration);
                    picture.addCellCount();
                }
                break;
        }
    };

    //=============================================================================
    // Game_Screen
    //  アニメーション関連の情報を追加で保持します。
    //=============================================================================
    Game_Screen.prototype.setPicturesAnimation = function(cellNumber, frameNumber, direction, fadeDuration) {
        this._paCellNumber   = cellNumber;
        this._paFrameNumber  = frameNumber;
        this._paDirection    = direction;
        this._paFadeDuration = fadeDuration;
    };

    Game_Screen.prototype.clearPicturesAnimation = function() {
        this._paCellNumber   = 1;
        this._paFrameNumber  = 1;
        this._paDirection    = '';
        this._paFadeDuration = 0;
    };

    var _Game_Screen_showPicture = Game_Screen.prototype.showPicture;
    Game_Screen.prototype.showPicture = function(pictureId, name, origin, x, y,
                                                 scaleX, scaleY, opacity, blendMode) {
        _Game_Screen_showPicture.apply(this, arguments);
        var realPictureId = this.realPictureId(pictureId);
        if (this._paCellNumber > 1) {
            this._pictures[realPictureId].setAnimationInit(
                this._paCellNumber, this._paFrameNumber, this._paDirection, this._paFadeDuration);
            this.clearPicturesAnimation();
        }
    };

    //=============================================================================
    // Game_Picture
    //  アニメーション関連の情報を追加で保持します。
    //=============================================================================
    var _Game_Picture_initialize = Game_Picture.prototype.initialize;
    Game_Picture.prototype.initialize = function() {
        _Game_Picture_initialize.call(this);
        this.initAnimation();
    };

    Game_Picture.prototype.initAnimation = function() {
        this._cellNumber        = 1;
        this._frameNumber       = 1;
        this._cellCount         = 0;
        this._frameCount        = 0;
        this._animationType     = 0;
        this._customArray       = null;
        this._loopFlg           = false;
        this._direction         = '';
        this._fadeDuration      = 0;
        this._fadeDurationCount = 0;
        this._prevCellCount     = 0;
        this._animationFlg      = false;
    };

    Game_Picture.prototype.direction = function() {
        return this._direction;
    };

    Game_Picture.prototype.cellNumber = function() {
        return this._cellNumber;
    };

    Game_Picture.prototype.prevCellCount = function() {
        return this._prevCellCount;
    };

    Game_Picture.prototype.isMulti = function() {
        var dir = this.direction();
        return dir === '連番' || dir === 'N';
    };

    /**
     * The cellCount of the Game_Picture (0 to cellNumber).
     *
     * @property cellCount
     * @type Number
     */
    Object.defineProperty(Game_Picture.prototype, 'cell', {
        get: function() {
            switch (this._animationType) {
                case 3:
                    return (this._customArray[this._cellCount] - 1).clamp(0, this._cellNumber - 1);
                case 2:
                    return this._cellNumber - 1 - Math.abs(this._cellCount - (this._cellNumber - 1));
                case 1:
                    return this._cellCount;
                default:
                    return this._cellCount;
            }
        },
        set: function(value) {
            var newCellCount = value % this.getCellNumber();
            if (this._cellCount !== newCellCount) {
                this._prevCellCount     = this.cell;
                this._fadeDurationCount = this._fadeDuration;
            }
            this._cellCount = newCellCount;
        },
        configurable: true
    });

    Game_Picture.prototype.getCellNumber = function() {
        switch (this._animationType) {
            case 3:
                return this._customArray.length;
            case 2:
                return (this._cellNumber - 1) * 2;
            case 1:
                return this._cellNumber;
            default:
                return this._cellNumber;
        }
    };

    var _Game_Picture_update = Game_Picture.prototype.update;
    Game_Picture.prototype.update = function() {
        _Game_Picture_update.call(this);
        if (this.isFading()) {
            this.updateFading();
        } else if(this.isAnimation()) {
            this.updateAnimation();
        }
    };

    Game_Picture.prototype.updateAnimation = function() {
        if (!this.isAnimation()) return;
        this._frameCount = (this._frameCount + 1) % this._frameNumber;
        if (this._frameCount === 0) {
            this.addCellCount();
            if (this._cellCount === 0 && !this._loopFlg) {
                this._animationFlg  = false;
            }
        }
    };

    Game_Picture.prototype.updateFading = function() {
        this._fadeDurationCount--;
    };

    Game_Picture.prototype.prevCellOpacity = function() {
        if (this._fadeDuration === 0) return 0;
        return this.opacity() / this._fadeDuration * this._fadeDurationCount;
    };

    Game_Picture.prototype.addCellCount = function() {
        this.cell = this._cellCount + 1;
    };

    Game_Picture.prototype.setAnimationInit = function(cellNumber, frameNumber, direction, fadeDuration) {
        this._cellNumber   = cellNumber;
        this._frameNumber  = frameNumber;
        this._frameCount   = 0;
        this._cellCount    = 0;
        this._direction    = direction;
        this._fadeDuration = fadeDuration;
    };

    Game_Picture.prototype.startAnimation = function(animationType, loopFlg, customArray) {
        this._animationType = animationType;
        this._customArray = customArray;
        this._animationFlg = true;
        this._loopFlg = loopFlg;
    };

    Game_Picture.prototype.stopAnimation = function(forceFlg) {
        this._loopFlg = false;
        if (forceFlg) this._animationFlg = false;
    };

    Game_Picture.prototype.isAnimation = function() {
        return this._animationFlg;
    };

    Game_Picture.prototype.isFading = function() {
        return this._fadeDurationCount !== 0;
    };

    //=============================================================================
    // Sprite_Picture
    //  アニメーション関連の情報を追加で保持します。
    //=============================================================================
    var _Sprite_Picture_initialize = Sprite_Picture.prototype.initialize;
    Sprite_Picture.prototype.initialize = function(pictureId) {
        this._prevSprite = new Sprite();
        this._prevSprite.visible = false;
        _Sprite_Picture_initialize.apply(this, arguments);
        this.addChild(this._prevSprite);
    };

    var _Sprite_Picture_update = Sprite_Picture.prototype.update;
    Sprite_Picture.prototype.update = function() {
        _Sprite_Picture_update.call(this);
        if (this.picture() != null) {
            if (this.picture().isMulti() && this._bitmaps == null) {
                this.loadAnimationBitmap();
            }
            if (this.isBitmapReady()) {
                this.updateAnimation(this, this.picture().cell);
                this.updateFading();
            }
        }
    };

    var _Sprite_Picture_updateBitmap = Sprite_Picture.prototype.updateBitmap;
    Sprite_Picture.prototype.updateBitmap = function() {
        _Sprite_Picture_updateBitmap.call(this);
        if (this.picture() == null) {
            this._bitmaps = null;
            this._prevSprite.bitmap = null;
            this._prevSprite.visible = false;
        }
    };

    Sprite_Picture.prototype.updateFading = function() {
        if (this.picture().isFading()) {
            this._prevSprite.visible = true;
            this.updateAnimation(this._prevSprite, this.picture().prevCellCount());
            this._prevSprite.opacity = this.picture().prevCellOpacity();
        } else {
            this._prevSprite.visible = false;
        }
    };

    Sprite_Picture.prototype.updateAnimation = function(sprite, cellCount) {
        switch (this.picture().direction()) {
            case '連番':
            case 'N':
                sprite.bitmap = this._bitmaps[cellCount];
                sprite.setFrame(0, 0, sprite.bitmap.width, sprite.bitmap.height);
                break;
            case '縦':
            case 'V':
                var height = sprite.bitmap.height / this.picture().cellNumber();
                var y      = cellCount * height;
                sprite.setFrame(0, y, sprite.bitmap.width, height);
                break;
            case '横':
            case 'H':
                var width = sprite.bitmap.width / this.picture().cellNumber();
                var x     = cellCount * width;
                sprite.setFrame(x, 0, width, this.bitmap.height);
                break;
        }
    };

    var _Sprite_Picture_loadBitmap = Sprite_Picture.prototype.loadBitmap;
    Sprite_Picture.prototype.loadBitmap = function() {
        _Sprite_Picture_loadBitmap.call(this);
        this._prevSprite.bitmap = this.bitmap;
        this._bitmapReady = false;
        this._bitmaps = null;
    };

    Sprite_Picture.prototype.loadAnimationBitmap = function() {
        var cellNumber = this.picture().cellNumber();
        var cellDigit = cellNumber.toString().length;
        this._bitmaps = [this.bitmap];
        for (var i = 1; i < cellNumber; i++) {
            var filename = this._pictureName.substr(0, this._pictureName.length - cellDigit) + i.padZero(cellDigit);
            this._bitmaps[i] = ImageManager.loadPicture(filename);
        }
        this._bitmapReady = false;
    };

    Sprite_Picture.prototype.isBitmapReady = function() {
        if (this._bitmapReady) return true;
        var result;
        if (this.picture().isMulti()) {
            result = this._bitmaps.every(function(bitmap) {
                return bitmap.isReady();
            });
        } else {
            result = this.bitmap.isReady();
        }
        this._bitmapReady = result;
        return result;
    };
})();