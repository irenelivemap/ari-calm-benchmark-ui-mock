(function (root, factory) {
  const pairs = factory();
  if (typeof module === 'object' && module.exports) module.exports = pairs;
  if (root) root.AriCalmBenchmarkMockRoutePairs = pairs;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function decodePolyline(value, precision = 6) {
    const geometry = [];
    const factor = 10 ** precision;
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < value.length) {
      const deltas = [];
      for (let coordinate = 0; coordinate < 2; coordinate += 1) {
        let result = 0;
        let shift = 0;
        let byte;
        do {
          byte = value.charCodeAt(index) - 63;
          index += 1;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        deltas.push((result & 1) ? ~(result >> 1) : result >> 1);
      }
      lat += deltas[0];
      lng += deltas[1];
      geometry.push([lat / factor, lng / factor]);
    }

    return geometry;
  }

  const rounds = [
    {
      pairId: 'calm-route-comparison-01',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-1-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2188.454, durationSeconds: 1576, fastDurationSeconds: 1441, profile: 'foot_calm' },
          encoded: "uoplyA_e~hOX}@zN{{@rg@rXx@xAbC`AdBIhWtQzAvA}@rDhD`Cl@}Bfy@~ZzAfCmKvo@hFn@jBs@piAnJvgAjKlCdAhDSpRjAzSD?sAz@sBbe@iDTsCm@sAu@i@zADtI{HhD}EjNcP`Rfd@pO`YjK`T|G`Q|HjW`CrGl@cAmAuG]wDJyBp@aBpDyCzCk@dOjB`EaVvF`RhApGzH`XfDjItEvFvL]hObGnIzGdi@h[hCPnIhDh@wENjE|CnAx@hCfCWfC^vBv@tFnEtArBjBlIr@nB`A|AnAdAbCx@~DEbBPfJ`DhLGrEo@vBuBhBkC`EaJpBiC|FkE~D_@lE^pE_@bCjB|Q|SzG|EvHzDtc@wHlAjAhKoGzK}I`KuKzIwLhBpDbWic@"
        },
        calm_nature: {
          routeId: 'calm-round-1-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2028.208, durationSeconds: 1460, fastDurationSeconds: 1441, profile: 'foot_calm_v1' },
          encoded: "uoplyA_e~hOuC|IpGzHdHrGtHfFrSjLoCxV}@lBlQbF`D}@hEzCb@nAtFnBfBUdf@dR|BbCvNxEv@{BlFjAGxC~@tAlu@lYxF\\dP`KfFxEbBfElJlM`Qx]fF|HhMvIhB~C`F`CpL`@zIk@z@g@l@sB`Ee@d@v@t@T`AIjzAmd@dDaBbBmDdCdAhEmC|CUdJeFtFyBlFe@~CNzCn@`C_A`C_EpKrSbL|RhSzZtDa@xBh@fKvHj@NxAF|CYtEjE`\\zRpUt^bOlSfOw@`Gb@fJtHpIa@hDwAbB}AxAuBrBsEhCqLlAmDhGcLhLGrEo@vBuBhBkC`EaJpBiC|FkE~D_@lE^pE_@bCjB|Q|SzG|EvHzDtc@wHlAjAdAtEdR}L~FcFjJaKtI{LbWic@"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-02',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-2-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 1381.154, durationSeconds: 994, fastDurationSeconds: 934, profile: 'foot_calm' },
          encoded: "qa}jyAwblhOaFdCgE~@}a@tEaS|CqDXu@o@BhGt@~Jb@dKPfKIlCeBfEyDdGbClHu^nZ|HrZvIvFbClEdA~@zAjApDl@XrNf`@xo@bCfBhBbEI`H~Gzm@uMtEuQrIjDbRbZ|j@mCnE`CrEeY~c@iuA|rBaCpEjUpc@pAa@zElIw@lC~CrG~Vfd@{BnEe[be@I~Hy\\pf@yApEk@f@"
        },
        calm_nature: {
          routeId: 'calm-round-2-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1410.268, durationSeconds: 1015, fastDurationSeconds: 934, profile: 'foot_calm_v1' },
          encoded: "qa}jyAwblhOsAv@`ApE|HvXvDnKzFlR{UrOpJ`e@}hApt@mItEwXbb@_SjXmSnUcFpHqEhIaE`Ja[||@kExJw@_AsNr[{ErH_F`LyClAsNnSo|@ttA}AoBcD_GdACzAb@Kh@cAScA|AvzAf|BzK`NhHvKkAnFtGjPhG~D`I~KF`EnDzAlUnRk@f@"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-03',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-3-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2152.284, durationSeconds: 1550, fastDurationSeconds: 1277, profile: 'foot_calm' },
          encoded: "uqfkyAokghOtHoEyAaDoCgKgSsm@vDyBcAmE}BwCiMyk@y@}ElgAmz@tB}@pDuCn@kAvN{KbCc@vL{FlrAwSfHkCrE}GzOo\\|DgFtEeDfFcBx@aHl`Aa@xDjAfIQhn@__@|L|i@Ch@lb@wTv]qUd[qP`AjDvbBa}@dKmE`D^tL}CpDzCxD~VxQmDdJnFlb@{LbQiKb@dCnCzAwBhELhBff@mb@pEsF`GoCbVyKbY}IxKi@bC\\~Bz@vBvAjBrBjFpIjD|KFxJbAvRtBxNtBXnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        },
        calm_nature: {
          routeId: 'calm-round-3-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2036.808, durationSeconds: 1467, fastDurationSeconds: 1277, profile: 'foot_calm_v1' },
          encoded: "uqfkyAokghOvKaHnJ|c@~B?`hAkIlJeAtEiAzLkFbHeFx@}AfAmE~`@u\\dD\\~A_AvB`IvA}@|HrZvIvFbClEdA~@zAjApDl@XrNf`@xo@bCfBjC}HrDeFrKsExEuK`SsMlJoFfn@yb@pZwQnF{BnTmL`QqHb_@uLg@iGxJkBtCcItKkCnDRzL}DxEaAnIu@bWE~GgAtAiGnC{i@u@mNDuOh@yFC_G}AoKbEkEhGoLjCmMeAyJhAmCryA_x@hMaJ`Ab@hMoHrAIlk@gd@`DjKxBgBdAbF~S}OfJcIdJaGhA|FnJeDnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-04',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-4-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2152.191, durationSeconds: 1550, fastDurationSeconds: 1270, profile: 'foot_calm' },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGdBjLhDx@~DsD|Ag@vB}A~G]fQqGUyQnCG\\rNxy@qDUoUtFGFfGfGe@~Vof@zm@qpAj@oDp@yHqFqIu^qg@bBsA`^_k@fjAmqBuUg`@tg@w|@g]sj@kCnEyB{E{BqGm]}g@fDqE~^on@bANjC}DKgDrf@sz@~AEtFaIdXaEa@eCL{A|FkA"
        },
        calm_nature: {
          routeId: 'calm-round-4-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1790.64, durationSeconds: 1289, fastDurationSeconds: 1270, profile: 'foot_calm_v1' },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGe@cGKwI`@k`@iAgH}BiG{D}GnNgT|G}ObJiQfQmg@hCuDlC`AvBsH`c@c`AzBeD|FaB|BsB{A{Ez@cI~a@{s@nBmCdYsf@zGsK`IuOdMeSr@z@bA}@zDuGdBeEX{BjEqHpBw@rFeJjAuC_@eBPs@lm@mdApMoRdi@}s@kBeENgC~CoD_Uig@tOuWDqBa@eCL{A|FkA"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-05',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-5-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2323.943, durationSeconds: 1673, fastDurationSeconds: 1571, profile: 'foot_calm' },
          encoded: "}__lyA_cjfOv@tIH~F~Db@VwCxOwS|CwFnE{KbDaMlM{q@la@~RBpJzBfAjAaFf@h@tBeER|@MbEhAeAxI~DgBvIfPdJrCkAwQf|@tLvHv_@rYtt@j]gKxj@sAo@k@Fy@p@uGhYjHrEtAaGx]nCyAd_AeG~j@_JvRhh@d\\pI~MvIbDlHtDfIdA|IUzDr@pB|@xDbsBGzHa@fLs@tNoBbYYjKUfMCv_@Pj\\h@t^zEjxBv@v|@FrOOvc@a@t[u@bMiBpI~BtBYhPsAlF~@bB`@jC{Alp@gEzz@eF`m@{@\\_AvKs@tDk@lJp_@pPx@qF[gIzAqL"
        },
        calm_nature: {
          routeId: 'calm-round-5-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2385.715, durationSeconds: 1718, fastDurationSeconds: 1571, profile: 'foot_calm_v1' },
          encoded: "}__lyA_cjfOv@tIH~FSdHe@zDw@rDoNf_@qFjKrCpBEdBdIcHjE|Hh@|A\\pCHlFb@lDfAdArDn@~@vAJnBkB`Oo@|B_AlBgAbGdAbC`@`DIhDs@tCkBlDgWd[mHlK~AxBnDv@l@vJkB|@qDlN~MjQbMbSvDdH|BdGdFqAfQr`@bDtOhDpL{ArKfAfCrArBl\\nUbFeCpBhKV`CjEpJvR`QbXmZ|UcZpQwYdIeQpI{UpDiLtAsFj@cQd@aAl@Khh@d\\pI~MvIbDlHtDfIdA|IUzDr@pB|@xDbsBGzHa@fLs@tNoBbYYjKUfMCv_@Pj\\h@t^zEjxBv@v|@FrOOvc@a@t[u@bMiBpI~BtBYhPsAlF~@bB`@jC{Alp@gEzz@eF`m@{@\\_AvKs@tDk@lJp_@pPx@qF[gIzAqL"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-06',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-6-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2391.462, durationSeconds: 1722, fastDurationSeconds: 1650, profile: 'foot_calm' },
          encoded: "kdfkyA{kshOhByAjMuPkAcSlCqE_M_c@{@NsHw\\d@Wr@zAh@a@k@oBm@q@cFoAuSu@k]Yw\\aA]uFPaEqAoh@t@]QoCuBqAbCkDqCsBxB}CoCaC`CcDqC}B~BiDiDkAK}Ci@iAiCiAjB_E}CiAfBgEyCmAbB_EwCuA`BkEuCaAbB_FwCiAxAgFoCm@bB_EiBkBeAiDo@iDoA{a@nLaElC_BfE{D~EkHbCoCxE_DrFcB_@mBz@_CoBgAhAsDcCoAzBaDoDk@tCiFuC_LkAiA{@MgEdABi@nDaIDmABeEeEpA}@aBoA{HgOu\\t@yj@MeGQ{AaAyAyASeKvFc@COu@ZmP\\{B@mAWyCmA_DaAcAoI}C{GiIaDiMi@sDQ{D?}Db@uGcDaCw@_Cg@q@aAy@kA_@a^yBqFDaJnAoAKoBu@_CgC_GoMaBwEsCqMy@eISmIDgDd@kI`@_D`Kaj@zKq^nBcJnRyaBf@{GBaHUyH{@mHk@oCmBmGaWci@uCwJy@gEqAaL_@qLPqLZuEpM}fARyCJ{CNgq@hDuD|m@sf@jO{MbQqR|q@ul@"
        },
        calm_nature: {
          routeId: 'calm-round-6-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2312.861, durationSeconds: 1665, fastDurationSeconds: 1650, profile: 'foot_calm_v1' },
          encoded: "kdfkyA{kshOhByAjMuPkAcSlCqE_Psj@MkA|AaBsAqFgCqFbFiH~B_AzEwCtHmB}AyUuMg`@{FqRrEwCDm@SS}G[UwBrJmCpAsB_Ee@uI[sF`@U_B}Wax@}DuXi@kAaCMQSDm@zBoBSe@wCNQYFc@hBoB@[SQaDI@m@|A{@Dc@iCm@}@gAMkAr@iCIeBS]{C{AFg@x@g@Ai@oCo@QUHc@jBm@Hg@_JmK]}@_@mBz@_CoBgAhAsDcCoAzBaDoDk@tCiFuC_LkAiA{@MgEdABi@nDaIDmABeEjEm@fAgXvgAciCaBeAyYwW{Vi~@iAcJy@uB`@_HlKebAdIyg@fB{JdBiHtEwNvBmFxAgCj@iBp@oFGyFoWg{@qJ}]iCkI{EiMoFoLcGuK{JqNwKyLsL}Jsj@yWux@eoAeByJhDuD|m@sf@jO{MbQqR|q@ul@"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-07',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-7-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2231.873, durationSeconds: 1607, fastDurationSeconds: 1482, profile: 'foot_calm' },
          encoded: "ygkiyAwwxhO_GpCm@_A{@ZgJzF}AbBcE|CqEpBqF|FkAmJeIq\\qBqAiM_s@_AkA_@I|BcJy@eH}DAuByI@mCuLyp@a@uAe@Sm@JyUhJm{@dWcAp@_EeEaA}IsAiHiPqmAko@zg@cCeJ{Pmz@GiB}BkGm@UoCyGkCgFeFuI_D_E_FcFkGsEqCiBkBg@_AoC}DwCsAdAiAI_d@kPmKeBkKUwU^oQSuEOk@kAq@^qEzGePvCkMtEc@tB_FjBuCLCpBqDRaAs@oI~C_B~AmAcDcJOUyHuYvM}Ie\\cOnFuFiGmCaA{EoGo@{HsFuUsEkN]wEwz@b{@eA`BiBiFsE|Dw@rBugCbhCuAh@wA?uGmC{A|EaHgCwB}CyAeEkIu\\MmA}BdHcAn@aE~M"
        },
        calm_nature: {
          routeId: 'calm-round-7-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2071.785, durationSeconds: 1492, fastDurationSeconds: 1482, profile: 'foot_calm_v1' },
          encoded: "ygkiyAwwxhO_GpCm@_A{@ZgJzF}AbBcE|CqEpBqF|FgBhCyl@jc@m@t@aO~J}ChDuC^gDhBmF~GiExCuC|EaDz@gIn@kD}@_GyEg@~AwEbA}FIuGbAuFg@qCwAue@q@__BBeG~CuI~BeV~KanA`o@qf@`UeFiTiLim@eC}JwNyQ{PqQSq@gFgGkE|E{DuG}h@_j@mA?}FoAsJwHePmQ`E}KLgBQ}Bs`@os@}@Y_B\\i_@le@{Yic@gBjCoS}[{Xt^_D_H{j@ygBU_F{AvHmKkFp@wFgJcDWi@g@eJoHc[gB_BcAn@aE~M"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-08',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-8-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 1023.171, durationSeconds: 737, fastDurationSeconds: 690, profile: 'foot_calm' },
          encoded: "iy~iyAu_jgOfAfWcAEcDnHFbCkLgM_o@ggAenAmxBiE{C}MkTmLhQoB|Es@xEmIqN{Az@gBtFuSm]cH~Lg\\nu@sC}CcAD{A~CoP_SsLkPyBUyC_DeBEqQjNgEhCa@dAkMaPsMjVwU~f@tA~D"
        },
        calm_nature: {
          routeId: 'calm-round-8-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1001.121, durationSeconds: 721, fastDurationSeconds: 690, profile: 'foot_calm_v1' },
          encoded: "iy~iyAu_jgOfAfWcAEcDnHFbCkLgMwRl`@qE}Fgd@{u@c\\yl@}[ij@mb@mu@qFwKkAeAmIqN{Az@gBtFuSm]mPuZiAMgt@xp@cEtHyBU{V~USxDNpEaBnCmDuAuFl]eCXeGfK}FpAsIyCyDNqCyEm@cB"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-09',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-9-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 1931.843, durationSeconds: 1391, fastDurationSeconds: 1324, profile: 'foot_calm' },
          encoded: "olejyAkdwgOhMkRfEmFpk@k`@tFkCwO}r@{A{FgAyBoCeLUmCsHo]wCkKd@yFlBHAkE~EstAv@uIrAmIrEmFwIqUuNyWo@SaFeGtDyFeYud@cEkTm@aI}Dr@DiMeG{~@BsD}FiItAkB`@gCCkTh@iTj@eHBsQkAmDmE_`Ak@aEVuCcAuHnC}@w@yEf@QiAiG@u@lRwh@pAaBlOeLbMgOnSa]lJwJ~IoH`OkItNmFrF}Ee@}Blb@mg@wCmMxEiNx@uGlDuE@qDQeE_EgMAeHtFqGb@JdTmXw@{@t@fBfMmVjEwJtJwX|DoPhEoOtHu@dCwn@bAsP~D}_@"
        },
        calm_nature: {
          routeId: 'calm-round-9-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1918.585, durationSeconds: 1381, fastDurationSeconds: 1324, profile: 'foot_calm_v1' },
          encoded: "olejyAkdwgOhMkRaBgH@}BbFuC}Uw}@sFuIfEmEjGcEcFam@tDSbJmE|@s@V{@pEqCdACvFcCd@yFlBHAkEpD_eAl@sNv@uIrAmIrEmFnD}HhIoC`m@}`@O_CtEsFmDa`@aBaL}AqNMcDF_A{A{GoEe]i@iRjR}DdAmGnTe]nBi[rCuLFyHjLkBIgL`@wCpG_CbF}FeFiMePacBf@aJ|FmMnZeTJ_Lc@yOwF_McGmRrHoQ~_@{h@uDeQzCsE_Be@oAyAcEg^mIm^dB_KgCoGNuK{@`@eEiL}DcEjEwJtJwX|DoPhEoOtHu@dCwn@bAsP~D}_@"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-10',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-10-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2424.941, durationSeconds: 1746, fastDurationSeconds: 1458, profile: 'foot_calm' },
          encoded: "_}liyA_idiOj@uD{CgKkDsF{A_FcK_d@mFoSoDjB_BNkBKyCqAyHmFkHiCcTqAy@Ne@`AkEs@eAuBuAsAyJwDcAWu@\\aMlIiQ|MgLrXoFfHwAuBkhAhbAqF\\q_@vY}C|DsAdAiAIaAdJeA~Ceb@pa@{NzOcLvN_BlAaEfHmo@t|@yAHwKnMkAjGpBrDUnCuCrCiBAoc@xo@yQfWuTnU{Bz@if@`g@}@rAm@dBc@lDAxB_EZoIpGkJyMaMlUJrI}EzHeRhRa@v@t@dGq@jBPdEApDmDtEy@tGyEhNvClMmb@lg@d@|BsF|EuNlFaOjI_JnHmJvJoS`]cMfOmOdL_GqCmCj@uPyS{At@iEnLeEdEmF|CySZqEh@qEdAoKzE{DpC}KbM_AfAiJrDyGl@p@|L`Chr@JfMpJlZ|BtKhLhTp@]|Eb@vExB"
        },
        calm_nature: {
          routeId: 'calm-round-10-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 2283.774, durationSeconds: 1644, fastDurationSeconds: 1458, profile: 'foot_calm_v1' },
          encoded: "_}liyA_idiOGb@cCxCcBhAgO`OS|AaCjBqA\\wLlKsBzCOfA}DrDm@D_WrRsCzAin@bg@zOnrA|@`DgWpQo@jAcDjC}o@`e@oAd@wFfFmx@bl@^pGeCjDqDjDsm@td@gDtBtHzmAw@p@qFdC{G`C_HtEpB~LTzFanA`o@qf@`UwPhJeh@jVqG`Co|@rb@{FlAoZdT}FlMg@`JdP`cBdFhMcF|FqG~Ba@vCeOdEaWUgo@iCku@}Aud@{AiMhARnD_YcAmHD}Hn@eJJPx@iAbV}@rEeKwE"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-11',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-11-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 1527.361, durationSeconds: 1100, fastDurationSeconds: 920, profile: 'foot_calm' },
          encoded: "sxgjyAqshhOAkBaQiCia@fKsOe@_MhA_HxCI_GaFcD{@yQsEgAiCRuBmEoCoCgGsCyEuA}E{@wE?oC?ue@sHcGGmAgE{CDsJbE_Eh@}CUBkAcIo@_CpByoAiMsGZgI_@}SlEySfACcIsP_@}BbLiAxIo@lIEhEqDtKkGxEi@bDuKlo@{HbJ_C|AmBu@gBDyJpUwBbN{m@tkD@lCk@tEvl@zYb@iCsH{DuMtu@qKrs@"
        },
        calm_nature: {
          routeId: 'calm-round-11-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1305.703, durationSeconds: 940, fastDurationSeconds: 920, profile: 'foot_calm_v1' },
          encoded: "sxgjyAqshhOAkBaQiCia@fKsOe@_MhA_HxCaEnDq|@fAmFAsB]iOSsKdKaEbHiF}@YnI{Ma@]nJmBx@uK?J~EsFdCkR`Pi@nGqDrX}GrHqHhe@_^{NwB|@ih@yT{DnXaHj]}Mh_@iAjBqA]_\\i_@mGdSmCs@cNhw@iA|JeFxNw@pEsH{DuMtu@qKrs@"
        }
      }
    },
    {
      pairId: 'calm-route-comparison-12',
      scenario: 'Two blinded walking routes with the same start and destination.',
      routes: {
        calm_quiet: {
          routeId: 'calm-round-12-calm-quiet',
          source: 'calm_quiet',
          metadata: { distanceMeters: 2094.178, durationSeconds: 1508, fastDurationSeconds: 1084, profile: 'foot_calm' },
          encoded: "chakyA{pwfOmFoEywAmuAqBsBwBmD{e@ge@uBcE_DkEmHmIzAiAbAoBdB{JlYgmBzAcMeByJyLkNaFeEgCf@oBfCsBtEiHoGtJgZz@mEqP}_@_E{KqI{YcBq@eDmI`CsGcd@unBcD_LcAwB~GmQkD}EiErKiKcXiIePuJgOqEdKyHsGol@e^gCmR}BgEkAjCaEqEuA|CebAsd@qArE}CeCq@oCer@oc@aRkKuPcH}Iv[GjOgB`HyK_LoOzj@qCgBqa@jyAoEsC_FpAc@}JwCkAgI}EuY{ScAa@a@vA"
        },
        calm_nature: {
          routeId: 'calm-round-12-calm-nature',
          source: 'calm_nature',
          metadata: { distanceMeters: 1505.583, durationSeconds: 1084, fastDurationSeconds: 1084, profile: 'foot_calm_v1' },
          encoded: "chakyA{pwfOmFoEywAmuAqBsBwBmD{e@ge@uBcE_DkEmHmI}@Coc@}b@}EgDsAiEgH}H{Bb@oZkZi]a\\_UsRas@yo@a@aBXmCeDaDcBLyAe@yWeXiP}ScEiHsEyQ?gE}AqBiAmDc@gFsCMqCt@iOiAwDeCaB~@iBJ_EyAkGkE{k@kl@aEgEc@_FgFmDkDcE_Aj@_B@}\\oNcMiD{BoFkGsK}Gsl@sA{Pc@}JwCkAgI}EuY{ScAa@a@vA"
        }
      }
    }
  ];

  return rounds.map(round => {
    const routes = Object.fromEntries(
      Object.entries(round.routes).map(([routeType, route]) => [
        routeType,
        {
          routeId: route.routeId,
          routeType,
          source: route.source,
          metadata: route.metadata,
          geometry: decodePolyline(route.encoded)
        }
      ])
    );
    const referenceGeometry = routes.calm_quiet.geometry;
    const [originLat, originLng] = referenceGeometry[0];
    const [destinationLat, destinationLng] = referenceGeometry[referenceGeometry.length - 1];
    return {
      pairId: round.pairId,
      scenario: round.scenario,
      origin: { lat: originLat, lng: originLng, label: 'Start' },
      destination: { lat: destinationLat, lng: destinationLng, label: 'Destination' },
      routes
    };
  });
});
