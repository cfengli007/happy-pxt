/***
 * @1900-2100区间内的公历、农历互转
 * @charset UTF-8
 * @Author  Jea杨(JJonline@JJonline.Cn)
 * @Time    2014-7-21
 * @Time    2016-8-13 Fixed 2033hex、Attribution Annals
 * @Time    2016-9-25 Fixed lunar LeapMonth Param Bug
 * @Time    2017-7-24 Fixed use getTerm Func Param Error.use solar year,NOT lunar year
 * @Version 1.0.3
 * @公历转农历：calendar.solar2lunar(1987,11,01); //[you can ignore params of prefix 0]
 * @农历转公历：calendar.lunar2solar(1987,09,10); //[you can ignore params of prefix 0]
 */
var solarlunar = {
    /**
     * 农历1900-2100的润大小信息表
     * @Array Of Property
     * @return Hex
     */
    lunarInfo: [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, //1900-1909
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, //1910-1919
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, //1920-1929
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, //1930-1939
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, //1940-1949
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, //1950-1959
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, //1960-1969
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, //1970-1979
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, //1980-1989
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, //1990-1999
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, //2000-2009
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, //2010-2019
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, //2020-2029
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, //2030-2039
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, //2040-2049
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, //2050-2059
        0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, //2060-2069
        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, //2070-2079
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, //2080-2089
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, //2090-2099
        0x0d520 //2100
    ],
    /**
     * 公历每个月份的天数普通表
     * @Array Of Property
     * @return Number
     */
    solarMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    /**
     * 天干地支之天干
     * @Array Of Property
     * @return String
     */
    gan: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
    /**
     * 天干地支之地支
     * @Array Of Property
     * @return String
     */
    zhi: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
    /**
     * 生肖
     * @Array Of Property
     * @return String
     */
    animals: ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"],
    /**
     * 24节气
     * @Array Of Property
     * @return String
     */
    lunarTerm: ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"],
    /**
     * 1900-2100各年的24节气日期速查表
     * @Array Of Property
     * @return Number
     */
    lTermInfo: [
        0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693,
        263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758
    ],
    /**
     * 数字转中文速查表
     * @Array Of Property
     * @return String
     */
    nStr1: ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    /**
     * 日期转农历称呼速查表
     * @Array Of Property
     * @return String
     */
    nStr2: ['初', '十', '廿', '卅'],
    /**
     * 月份转农历称呼速查表
     * @Array Of Property
     * @return String
     */
    nStr3: ['正', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'],
    /**
     * 返回农历y年一整年的总天数
     * @param lunar Year
     * @return Number
     * @eg:var count = calendar.lYearDays(1987)
     */
    lYearDays: function (y) {
        var i, sum = 348;
        for (i = 0x8000; i > 0x8; i >>= 1) {
            sum += (this.lunarInfo[y - 1900] & i) ? 1 : 0;
        }
        return (sum + this.leapDays(y));
    },
    /**
     * 返回农历y年闰月是哪个月；若y年没有闰月 则返回0
     * @param lunar Year
     * @return Number (0-12)
     * @eg:var leapMonth = calendar.leapMonth(1987)
     */
    leapMonth: function (y) {
        return (this.lunarInfo[y - 1900] & 0xf);
    },
    /**
     * 返回农历y年闰月的天数 若该年没有闰月则返回0
     * @param lunar Year
     * @return Number (0|29|30)
     * @eg:var leapMonthDay = calendar.leapDays(1987)
     */
    leapDays: function (y) {
        if (this.leapMonth(y)) {
            return ((this.lunarInfo[y - 1900] & 0x10000) ? 30 : 29);
        }
        return (0);
    },
    /**
     * 返回农历y年m月（非闰月）的总天数，计算m为闰月时的天数请使用leapDays方法
     * @param lunar Year
     * @param lunar Month
     * @return Number (-1|29|30)
     * @eg:var MonthDay = calendar.monthDays(1987,9)
     */
    monthDays: function (y, m) {
        if (m > 12 || m < 1) {
            return -1
        } //月份参数从1至12，参数错误返回-1
        return ((this.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29);
    },
    /**
     * 返回公历(!)y年m月的天数
     * @param solar Year
     * @param solar Month
     * @return Number (-1|28|29|30|31)
     * @eg:var solarMonthDay = calendar.leapDays(1987)
     */
    solarDays: function (y, m) {
        if (m > 12 || m < 1) {
            return -1
        } //若参数错误 返回-1
        var ms = m - 1;
        if (ms == 1) { //2月份的闰平规律测算后确认返回28或29
            return (((y % 4 == 0) && (y % 100 != 0) || (y % 400 == 0)) ? 29 : 28);
        } else {
            return (this.solarMonth[ms]);
        }
    },
    /**
     * 传入offset偏移量返回干支
     * @param offset 相对甲子的偏移量
     * @return Cn string
     */
    toGanZhi: function (offset) {
        return (this.gan[offset % 10] + this.zhi[offset % 12]);
    },
    /**
     * 传入公历(!)y年获得该年第n个节气的公历日期
     * @param y solar Year
     * @param n 节气（从0小寒算起）
     * @return Cn string
     * @eg:var _24 = calendar.getTerm(1987,3) ;//立春
     */
    getTerm: function (y, n) {
        if (y < 1900 || y > 2100) {
            return -1;
        }
        if (n < 0 || n > 23) {
            return -1;
        }
        var _table = this.lTermInfo[n];
        var _info = [
            parseInt('0x' + _table.toString(16).substr(0, 5)).toString(),
            parseInt('0x' + _table.toString(16).substr(5, 5)).toString()
        ];
        var _calday = [
            Math.floor(_info[0] * y / 10000 + _info[1] / 100),
            Math.floor(_info[0] * (y % 100) / 10000 + (y % 100) * _info[1] / 100000)
        ];
        return new Date(31556925974.7 * (y - 1900) + _calday[0] * 60 * 60 * 24 * 1000 + _calday[1] * 60 * 60 * 24 * 1000).getDate();
    },
    /**
     * 传入农历数字月份返回汉语通俗表示法
     * @param lunar month
     * @return Cn string
     * @eg:var cnMonth = calendar.toChinaMonth(12) ;//腊月
     */
    toChinaMonth: function (m) { // 月份转农历称呼
        if (m > 12 || m < 1) {
            return -1
        } //若参数错误 返回-1
        var s = this.nStr3[m - 1];
        if (m == 12) {
            s = this.nStr3[12];
        }
        if (m == 1) {
            s = this.nStr3[0];
        }
        return s + '月';
    },
    /**
     * 传入农历日期数字返回汉字表示法
     * @param lunar day
     * @return Cn string
     * @eg:var cnDay = calendar.toChinaDay(21) ;//廿一
     */
    toChinaDay: function (d) { // 日期转农历称呼
        var s;
        switch (d) {
            case 10:
                s = '初十';
                break;
            case 20:
                s = '二十';
                break;
            case 30:
                s = '三十';
                break;
            default:
                s = this.nStr2[Math.floor(d / 10)];
                s += this.nStr1[d % 10];
        }
        return (s);
    },
    /**
     * 年份转生肖[!仅能大致转换]
     * @param Anno Domini Year
     * @return Cn string
     * @eg:var animal = calendar.getAnimal(1987) ;//兔
     */
    getAnimal: function (y) { //传入公历年份获得生肖
        return this.animals[(y - 4) % 12]
    },
    /**
     * 农历年份转换为干支纪年
     * @param  lunarYear 农历年的年份数
     * @return Cn string
     */
    toGanZhiYear: function (lYear) {
        var ganKey = (lYear - 3) % 10;
        var zhiKey = (lYear - 3) % 12;
        if (ganKey == 0) ganKey = 10; // 如果余数为0则为最后一个天干
        if (zhiKey == 0) zhiKey = 12; // 如果余数为0则为最后一个地支
        return this.gan[ganKey - 1] + this.zhi[zhiKey - 1];
    },
    /**
     * 公历月、日判断所属星座
     * @param  cMonth [description]
     * @param  cDay [description]
     * @return Cn string
     */
    toAstro: function (cMonth, cDay) {
        var s = "魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯";
        var arr = [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 22, 22];
        return s.substr(cMonth * 2 - (cDay < arr[cMonth - 1] ? 2 : 0), 2) + "座";
    },
    /**
     * 传入公历(!)yr,mo,dy获得农历对象
     * @param y solar Year
     * @param m solar Month
     * @param d solar Day
     * @return JSON object
     * @eg:var lunar = calendar.solar2lunar(1987,11,01);
     */
    solar2lunar: function (sy, sm, sd) {
        //参数区间1900.1.31~2100.12.31
        //sy,sm,sd公历年月日
        //lunarYear,lunarMonth,lunarDay农历年月日
        //isLeap 当前农历月是否闰月
        //ganzhiYear,ganzhiMonth,ganzhiDay 年柱月柱日柱
        if (sy < 1900 || sy > 2100) {
            return -1;
        } //年份限定1900年-2100年
        if (sm < 1 || sm > 12) {
            return -1;
        } //月份限定12个月
        if (sd < 1 || sd > 31) {
            return -1;
        } //日期限定31天
        var solarYear = parseInt(sy);
        var solarMonth = parseInt(sm);
        var solarDay = parseInt(sd);
        var lunarYear, lunarMonth, lunarDay, isLeap, ganziYear, ganziMonth, ganziDay;
        //年份天数总和
        var dayCyclical = Date.UTC(solarYear, solarMonth - 1, solarDay) / 86400000 + 25567 + 10;
        var term2 = this.getTerm(solarYear, 2); // 立春日期
        //依据1900年立春日期的干支为庚子，以此作为起始点计算干支年，节气转换依据这个日期
        if (solarMonth <= 2 && (solarDay <= term2 && solarMonth == 2 || solarMonth < 2)) {
            ganziYear = this.toGanZhi(solarYear - 1900 + 36 - 1);
        } else {
            ganziYear = this.toGanZhi(solarYear - 1900 + 36);
        }
        var firstNode = this.getTerm(solarYear, (solarMonth - 1) * 2); //当月「节」为几日开始
        var secondNode = this.getTerm(solarYear, (solarMonth - 1) * 2 + 1); //当月「气」为几日开始
        //依据1900年的第一个节气的干支为丙寅，以此作为起始点计算干支月
        var cyclicalMonth = (Date.UTC(solarYear, solarMonth - 1, 1) / 86400000 + 25567 + 10 - 10) % 60;
        if (solarDay >= firstNode) {
            ganziMonth = this.toGanZhi((solarYear - 1900) * 12 + solarMonth + 11);
        } else {
            ganziMonth = this.toGanZhi((solarYear - 1900) * 12 + solarMonth + 10);
        }
        //依据1900年的春节的干支为庚子，以此作为起始点计算干支日
        ganziDay = this.toGanZhi(dayCyclical + 49);
        //计算农历年
        var offset = (Date.UTC(solarYear, solarMonth - 1, solarDay) - Date.UTC(1900, 0, 31)) / 86400000;
        var iYear, daysOfYear = 0;
        for (iYear = 1900; iYear < 2101 && offset > 0; iYear++) {
            daysOfYear = this.lYearDays(iYear);
            offset -= daysOfYear;
        }
        if (offset < 0) {
            offset += daysOfYear;
            iYear--;
        }
        lunarYear = iYear;
        var leap = this.leapMonth(lunarYear); //闰哪个月
        isLeap = false;
        //计算农历月
        var iMonth, daysOfMonth = 0;
        for (iMonth = 1; iMonth < 13 && offset > 0; iMonth++) {
            //闰月
            if (leap > 0 && iMonth == (leap + 1) && isLeap == false) {
                --iMonth;
                isLeap = true;
                daysOfMonth = this.leapDays(lunarYear);
            } else {
                daysOfMonth = this.monthDays(lunarYear, iMonth);
            }
            offset -= daysOfMonth;
            //解除闰月
            if (isLeap == true && iMonth == (leap + 1)) isLeap = false;
        }
        //正月初一为界，静止农历月超过12
        if (offset == 0 && leap > 0 && iMonth == leap + 1) {
            if (isLeap) {
                isLeap = false;
            } else {
                isLeap = true;
                --iMonth;
            }
        }
        if (offset < 0) {
            offset += daysOfMonth;
            --iMonth;
        }
        lunarMonth = iMonth;
        //计算农历日
        lunarDay = offset + 1;
        return {
            lYear: lunarYear,
            lMonth: lunarMonth,
            lDay: lunarDay,
            animal: this.getAnimal(lunarYear),
            monthCn: (isLeap && lunarMonth === this.leapMonth(lunarYear) ? '闰' : '') + this.toChinaMonth(lunarMonth),
            dayCn: this.toChinaDay(lunarDay),
            cYear: solarYear,
            cMonth: solarMonth,
            cDay: solarDay,
            gzYear: ganziYear,
            gzMonth: ganziMonth,
            gzDay: ganziDay,
            isToday: false, // This needs to be set by comparing with actual today's date
            isLeap: isLeap,
            nWeek: new Date(solarYear, solarMonth - 1, solarDay).getDay(),
            ncWeek: '星期' + this.nStr1[new Date(solarYear, solarMonth - 1, solarDay).getDay()],
            isTerm: false, // This needs specific logic to determine if it's a solar term day
            term: '', // Solar term name if isTerm is true
            astro: this.toAstro(solarMonth, solarDay)
        }
    },
    /**
     * 传入农历(!)yr,mo,dy获得公历对象
     * @param y lunar Year
     * @param m lunar Month
     * @param d lunar Day
     * @return JSON object
     * @eg:var solar = calendar.lunar2solar(1987,9,10);
     */
    lunar2solar: function (ly, lm, ld, isLeapMonth) {
        //参数区间1900年-2100年
        //ly,lm,ld农历年月日
        //solarYear,solarMonth,solarDay公历年月日
        isLeapMonth = isLeapMonth || false;
        if (ly < 1900 || ly > 2100) {
            return -1;
        } //年份限定1900年-2100年
        if (lm < 1 || lm > 12) {
            return -1;
        } //月份限定12个月
        if (ld < 1 || ld > 30) {
            return -1;
        } //日期限定30天
        var lunarYear = parseInt(ly);
        var lunarMonth = parseInt(lm);
        var lunarDay = parseInt(ld);
        var leap = this.leapMonth(lunarYear);
        //效验农历参数
        if (isLeapMonth && (leap != lunarMonth)) {
            return -1;
        } //传参要求计算该闰月公历 日期，但该年得出的闰月与传参的月份并不同
        if (lunarDay > this.monthDays(lunarYear, lunarMonth) && isLeapMonth == false || lunarDay > this.leapDays(lunarYear) && isLeapMonth == true) {
            return -1
        } //输入农历日期大于该农历月份的最大天数
        var offset = 0;
        var i;
        for (i = 1900; i < lunarYear; i++) {
            offset += this.lYearDays(i);
        }
        var daysInLunarMonth;
        for (i = 1; i < lunarMonth; i++) {
            daysInLunarMonth = this.monthDays(lunarYear, i);
            //解除闰月
            if (i == leap) {
                daysInLunarMonth += this.leapDays(lunarYear);
            }
            offset += daysInLunarMonth;
        }
        //当月是闰月时，offset校正
        if (isLeapMonth) {
            offset += this.monthDays(lunarYear, lunarMonth);
        }
        offset += lunarDay;
        var solarDate = new Date(Date.UTC(1900, 0, 31) + offset * 86400000);
        var solarYear = solarDate.getUTCFullYear();
        var solarMonth = solarDate.getUTCMonth() + 1;
        var solarDay = solarDate.getUTCDate();
        return this.solar2lunar(solarYear, solarMonth, solarDay); // Convert back to get all fields
    }
};