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
      pairId: "calm-route-comparison-01",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-1-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2188.454,
            durationSeconds: 1576,
            fastDurationSeconds: 1441,
            profile: "foot_calm"
          },
          encoded: "uoplyA_e~hOX}@zN{{@rg@rXx@xAbC`AdBIhWtQzAvA}@rDhD`Cl@}Bfy@~ZzAfCmKvo@hFn@jBs@piAnJvgAjKlCdAhDSpRjAzSD?sAz@sBbe@iDTsCm@sAu@i@zADtI{HhD}EjNcP`Rfd@pO`YjK`T|G`Q|HjW`CrGl@cAmAuG]wDJyBp@aBpDyCzCk@dOjB`EaVvF`RhApGzH`XfDjItEvFvL]hObGnIzGdi@h[hCPnIhDh@wENjE|CnAx@hCfCWfC^vBv@tFnEtArBjBlIr@nB`A|AnAdAbCx@~DEbBPfJ`DhLGrEo@vBuBhBkC`EaJpBiC|FkE~D_@lE^pE_@bCjB|Q|SzG|EvHzDtc@wHlAjAhKoGzK}I`KuKzIwLhBpDbWic@"
        },
        calm_nature: {
          routeId: "calm-round-1-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2028.208,
            durationSeconds: 1460,
            fastDurationSeconds: 1441,
            profile: "foot_calm_v1"
          },
          encoded: "uoplyA_e~hOuC|IpGzHdHrGtHfFrSjLoCxV}@lBlQbF`D}@hEzCb@nAtFnBfBUdf@dR|BbCvNxEv@{BlFjAGxC~@tAlu@lYxF\\dP`KfFxEbBfElJlM`Qx]fF|HhMvIhB~C`F`CpL`@zIk@z@g@l@sB`Ee@d@v@t@T`AIjzAmd@dDaBbBmDdCdAhEmC|CUdJeFtFyBlFe@~CNzCn@`C_A`C_EpKrSbL|RhSzZtDa@xBh@fKvHj@NxAF|CYtEjE`\\zRpUt^bOlSfOw@`Gb@fJtHpIa@hDwAbB}AxAuBrBsEhCqLlAmDhGcLhLGrEo@vBuBhBkC`EaJpBiC|FkE~D_@lE^pE_@bCjB|Q|SzG|EvHzDtc@wHlAjAdAtEdR}L~FcFjJaKtI{LbWic@"
        },
        fast: {
          routeId: "calm-round-1-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2001.091,
            durationSeconds: 1441,
            profile: "foot_fast"
          },
          encoded: "uoplyA_e~hOuC|IpGzHdHrGtHfFrSjLoCxV}@lBlQbF`D}@hEzCb@nAtFnBfBUdf@dR|BbCvNxEv@{BlFjAGxC~@tAlu@lYxF\\dP`KfFxEbBfElJlM`Qx]fF|HhMvIhB~C`F`CpL`@zIk@z@g@l@sB`Ee@d@v@t@T`AIjzAmd@dDaBbBmDdCdAhEmC|CUdJeFtFyBlFe@~CNzCn@`C_A`C_EpKrSbL|RhSzZtDa@xBh@fKvHj@NxAF|CYtEjE`\\zRpUt^bOlSfOw@`Gb@fJtHnSnTpDnArOe@fNiP`A}@hAa@xNq@~TqKbO_EhB_AjHaHbHgFjEkEh@iAtc@wHlAjAhKoGzK}I`KuKzIwLhBpDbWic@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-02",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-2-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1381.154,
            durationSeconds: 994,
            fastDurationSeconds: 934,
            profile: "foot_calm"
          },
          encoded: "qa}jyAwblhOaFdCgE~@}a@tEaS|CqDXu@o@BhGt@~Jb@dKPfKIlCeBfEyDdGbClHu^nZ|HrZvIvFbClEdA~@zAjApDl@XrNf`@xo@bCfBhBbEI`H~Gzm@uMtEuQrIjDbRbZ|j@mCnE`CrEeY~c@iuA|rBaCpEjUpc@pAa@zElIw@lC~CrG~Vfd@{BnEe[be@I~Hy\\pf@yApEk@f@"
        },
        calm_nature: {
          routeId: "calm-round-2-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1410.268,
            durationSeconds: 1015,
            fastDurationSeconds: 934,
            profile: "foot_calm_v1"
          },
          encoded: "qa}jyAwblhOsAv@`ApE|HvXvDnKzFlR{UrOpJ`e@}hApt@mItEwXbb@_SjXmSnUcFpHqEhIaE`Ja[||@kExJw@_AsNr[{ErH_F`LyClAsNnSo|@ttA}AoBcD_GdACzAb@Kh@cAScA|AvzAf|BzK`NhHvKkAnFtGjPhG~D`I~KF`EnDzAlUnRk@f@"
        },
        fast: {
          routeId: "calm-round-2-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1297.541,
            durationSeconds: 934,
            profile: "foot_fast"
          },
          encoded: "qa}jyAwblhOsAv@`ApE|HvXvDnKu\\jToJnF_DjDePjXyHvNwBxCmLfKeDzB_EbEy@`CbClEdA~@zAjApDl@XrNf`@xo@bCfBhBbEI`H~Gzm@uMtEuQrIjDbRbZ|j@mCnE`CrEo]zi@tJxQoD~EU`TjDlHyIjN~ChGo@bCiGzKyk@n{@uC`Dw@lC~CrG~Vfd@{BnEe[be@I~Hy\\pf@yApEk@f@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-03",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-3-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2152.284,
            durationSeconds: 1550,
            fastDurationSeconds: 1277,
            profile: "foot_calm"
          },
          encoded: "uqfkyAokghOtHoEyAaDoCgKgSsm@vDyBcAmE}BwCiMyk@y@}ElgAmz@tB}@pDuCn@kAvN{KbCc@vL{FlrAwSfHkCrE}GzOo\\|DgFtEeDfFcBx@aHl`Aa@xDjAfIQhn@__@|L|i@Ch@lb@wTv]qUd[qP`AjDvbBa}@dKmE`D^tL}CpDzCxD~VxQmDdJnFlb@{LbQiKb@dCnCzAwBhELhBff@mb@pEsF`GoCbVyKbY}IxKi@bC\\~Bz@vBvAjBrBjFpIjD|KFxJbAvRtBxNtBXnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        },
        calm_nature: {
          routeId: "calm-round-3-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2036.808,
            durationSeconds: 1467,
            fastDurationSeconds: 1277,
            profile: "foot_calm_v1"
          },
          encoded: "uqfkyAokghOvKaHnJ|c@~B?`hAkIlJeAtEiAzLkFbHeFx@}AfAmE~`@u\\dD\\~A_AvB`IvA}@|HrZvIvFbClEdA~@zAjApDl@XrNf`@xo@bCfBjC}HrDeFrKsExEuK`SsMlJoFfn@yb@pZwQnF{BnTmL`QqHb_@uLg@iGxJkBtCcItKkCnDRzL}DxEaAnIu@bWE~GgAtAiGnC{i@u@mNDuOh@yFC_G}AoKbEkEhGoLjCmMeAyJhAmCryA_x@hMaJ`Ab@hMoHrAIlk@gd@`DjKxBgBdAbF~S}OfJcIdJaGhA|FnJeDnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        },
        fast: {
          routeId: "calm-round-3-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1773.406,
            durationSeconds: 1277,
            profile: "foot_fast"
          },
          encoded: "uqfkyAokghOvKaHs@aEvWyO`TmOxRoOpo@m`@xUqKbDy@jBiAvDmDjA`G~Q~MpLtFpNpCzIj@~Fe@bYkGb[kFvLaEre@_\\xScMj`@eTv[aMxMkEhYmIpGsAvKeAfdAeHv[uKtBjFbEkEhGoLjCmMnBdCjA_CdBe@hMeGBwBhAaBlnAup@jR_LzBo@tFmDl@w@vf@w`@dAbF~S}OfJcIdJaGhA|FnJeDnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        }
      }
    },
    {
      pairId: "calm-route-comparison-04",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-4-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2152.191,
            durationSeconds: 1550,
            fastDurationSeconds: 1270,
            profile: "foot_calm"
          },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGdBjLhDx@~DsD|Ag@vB}A~G]fQqGUyQnCG\\rNxy@qDUoUtFGFfGfGe@~Vof@zm@qpAj@oDp@yHqFqIu^qg@bBsA`^_k@fjAmqBuUg`@tg@w|@g]sj@kCnEyB{E{BqGm]}g@fDqE~^on@bANjC}DKgDrf@sz@~AEtFaIdXaEa@eCL{A|FkA"
        },
        calm_nature: {
          routeId: "calm-round-4-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1790.64,
            durationSeconds: 1289,
            fastDurationSeconds: 1270,
            profile: "foot_calm_v1"
          },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGe@cGKwI`@k`@iAgH}BiG{D}GnNgT|G}ObJiQfQmg@hCuDlC`AvBsH`c@c`AzBeD|FaB|BsB{A{Ez@cI~a@{s@nBmCdYsf@zGsK`IuOdMeSr@z@bA}@zDuGdBeEX{BjEqHpBw@rFeJjAuC_@eBPs@lm@mdApMoRdi@}s@kBeENgC~CoD_Uig@tOuWDqBa@eCL{A|FkA"
        },
        fast: {
          routeId: "calm-round-4-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1764.063,
            durationSeconds: 1270,
            profile: "foot_fast"
          },
          encoded: "}c~jyAmmseO|Uos@xAhBfBaErLa_@D}KpNmd@pC_Hts@uzBsAeCtGeM{G{K`Q_ZnIsPbAcHjAeN`Nl@nIuGe@cGKwI`@k`@iAgH}BiG{D}GnNgT|G}ObJiQfQmg@hCuDP}GdTgf@|Wqj@uB}RxGgC{AkFeD}Xu@_KzSkc@nCwEfAuEv]au@dCeEhAqEtW{j@zJoNjFkLpPm[xAmDfDqE~^on@bANjC}DKgDrf@sz@~AEtFaIdXaEa@eCL{A|FkA"
        }
      }
    },
    {
      pairId: "calm-route-comparison-05",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-5-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2323.943,
            durationSeconds: 1673,
            fastDurationSeconds: 1571,
            profile: "foot_calm"
          },
          encoded: "}__lyA_cjfOv@tIH~F~Db@VwCxOwS|CwFnE{KbDaMlM{q@la@~RBpJzBfAjAaFf@h@tBeER|@MbEhAeAxI~DgBvIfPdJrCkAwQf|@tLvHv_@rYtt@j]gKxj@sAo@k@Fy@p@uGhYjHrEtAaGx]nCyAd_AeG~j@_JvRhh@d\\pI~MvIbDlHtDfIdA|IUzDr@pB|@xDbsBGzHa@fLs@tNoBbYYjKUfMCv_@Pj\\h@t^zEjxBv@v|@FrOOvc@a@t[u@bMiBpI~BtBYhPsAlF~@bB`@jC{Alp@gEzz@eF`m@{@\\_AvKs@tDk@lJp_@pPx@qF[gIzAqL"
        },
        calm_nature: {
          routeId: "calm-round-5-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2385.715,
            durationSeconds: 1718,
            fastDurationSeconds: 1571,
            profile: "foot_calm_v1"
          },
          encoded: "}__lyA_cjfOv@tIH~FSdHe@zDw@rDoNf_@qFjKrCpBEdBdIcHjE|Hh@|A\\pCHlFb@lDfAdArDn@~@vAJnBkB`Oo@|B_AlBgAbGdAbC`@`DIhDs@tCkBlDgWd[mHlK~AxBnDv@l@vJkB|@qDlN~MjQbMbSvDdH|BdGdFqAfQr`@bDtOhDpL{ArKfAfCrArBl\\nUbFeCpBhKV`CjEpJvR`QbXmZ|UcZpQwYdIeQpI{UpDiLtAsFj@cQd@aAl@Khh@d\\pI~MvIbDlHtDfIdA|IUzDr@pB|@xDbsBGzHa@fLs@tNoBbYYjKUfMCv_@Pj\\h@t^zEjxBv@v|@FrOOvc@a@t[u@bMiBpI~BtBYhPsAlF~@bB`@jC{Alp@gEzz@eF`m@{@\\_AvKs@tDk@lJp_@pPx@qF[gIzAqL"
        },
        fast: {
          routeId: "calm-round-5-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2181.97,
            durationSeconds: 1571,
            profile: "foot_fast"
          },
          encoded: "}__lyA_cjfOv@tIH~FSdHe@zDw@rDoNf_@qFjKrCpBEdBdIcHjE|Hh@|A\\pCHlFb@lDfAdArDn@~@vAJnBkB`Oo@|B_AlBbIzBeEzW}AjEsYj^cB~DWlEl@vJkB|@qDlN~MjQbMbSvDdH|BdGdFqAfQr`@bDtOhDpL{ArKfAfCrArBl\\nUqPj\\cNtYkBlFuElPHzDiJ`^wGf[\\dDoIjh@qFpZWHcCbN_EzXyUbcCgBvX?~Bh@tDt@dB`AnA}A|O~KzBlh@nNrCpAtAvBd@bGxBlJhClH`DhE`EtCj`AxWfFjCp@tAAzCtFjDvCwA|ClBpFbGfu@hdAvBxDv`@bi@x@zAbAnGvOnSpD`AhAqIzDdAd@dCv@lBdNfRbBfDlANnAMjAg@`AaAk@lJp_@pPx@qF[gIzAqL"
        }
      }
    },
    {
      pairId: "calm-route-comparison-06",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-6-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2391.462,
            durationSeconds: 1722,
            fastDurationSeconds: 1650,
            profile: "foot_calm"
          },
          encoded: "kdfkyA{kshOhByAjMuPkAcSlCqE_M_c@{@NsHw\\d@Wr@zAh@a@k@oBm@q@cFoAuSu@k]Yw\\aA]uFPaEqAoh@t@]QoCuBqAbCkDqCsBxB}CoCaC`CcDqC}B~BiDiDkAK}Ci@iAiCiAjB_E}CiAfBgEyCmAbB_EwCuA`BkEuCaAbB_FwCiAxAgFoCm@bB_EiBkBeAiDo@iDoA{a@nLaElC_BfE{D~EkHbCoCxE_DrFcB_@mBz@_CoBgAhAsDcCoAzBaDoDk@tCiFuC_LkAiA{@MgEdABi@nDaIDmABeEeEpA}@aBoA{HgOu\\t@yj@MeGQ{AaAyAyASeKvFc@COu@ZmP\\{B@mAWyCmA_DaAcAoI}C{GiIaDiMi@sDQ{D?}Db@uGcDaCw@_Cg@q@aAy@kA_@a^yBqFDaJnAoAKoBu@_CgC_GoMaBwEsCqMy@eISmIDgDd@kI`@_D`Kaj@zKq^nBcJnRyaBf@{GBaHUyH{@mHk@oCmBmGaWci@uCwJy@gEqAaL_@qLPqLZuEpM}fARyCJ{CNgq@hDuD|m@sf@jO{MbQqR|q@ul@"
        },
        calm_nature: {
          routeId: "calm-round-6-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2312.861,
            durationSeconds: 1665,
            fastDurationSeconds: 1650,
            profile: "foot_calm_v1"
          },
          encoded: "kdfkyA{kshOhByAjMuPkAcSlCqE_Psj@MkA|AaBsAqFgCqFbFiH~B_AzEwCtHmB}AyUuMg`@{FqRrEwCDm@SS}G[UwBrJmCpAsB_Ee@uI[sF`@U_B}Wax@}DuXi@kAaCMQSDm@zBoBSe@wCNQYFc@hBoB@[SQaDI@m@|A{@Dc@iCm@}@gAMkAr@iCIeBS]{C{AFg@x@g@Ai@oCo@QUHc@jBm@Hg@_JmK]}@_@mBz@_CoBgAhAsDcCoAzBaDoDk@tCiFuC_LkAiA{@MgEdABi@nDaIDmABeEjEm@fAgXvgAciCaBeAyYwW{Vi~@iAcJy@uB`@_HlKebAdIyg@fB{JdBiHtEwNvBmFxAgCj@iBp@oFGyFoWg{@qJ}]iCkI{EiMoFoLcGuK{JqNwKyLsL}Jsj@yWux@eoAeByJhDuD|m@sf@jO{MbQqR|q@ul@"
        },
        fast: {
          routeId: "calm-round-6-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2292.086,
            durationSeconds: 1650,
            profile: "foot_fast"
          },
          encoded: "kdfkyA{kshOhByAjMuPkAcSlCqE_Psj@MkA|AaBsAqFgCqFbFiH~B_AzEwCtHmB}AyUuMg`@{FqRrEwCDm@SS}G[UwBrJmCpAsB_Ee@uI[sF`@U_B}Wax@}DuXi@kAaCMQSDm@zBoBSe@wCNQYFc@hBoB@[SQaDI@m@|A{@Dc@iCm@}@gAMkAr@iCIeBS]{C{AFg@x@g@Ai@oCo@QUHc@jBm@Hg@_JmK]}@_@mBz@_CoBgAhAsDcCoAzBaDoDk@tCiFuC_LkAiA{@MgEdABi@nDaIDmABeEeEpA}@aBoA{HgOu\\t@yj@MeGQ{AaAyAyASeKvFc@COu@ZmP\\{B@mAWyCmA_DaAcAoI}C{GiIaDiMi@sDQ{D?}Db@uGcDaCw@_Cg@q@aAy@kA_@a^yBqFDaJnAoAKoBu@_CgC_GoMaBwEsCqMy@eISmIDgDd@kI`@_D`Kaj@zKq^nBcJnRyaBf@{GBaHUyH{@mHk@oCmBmGaWci@uCwJy@gEqAaL_@qLPqLZuEpM}fARyCJ{CNgq@hDuD|m@sf@jO{MbQqR|q@ul@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-07",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-7-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2231.873,
            durationSeconds: 1607,
            fastDurationSeconds: 1482,
            profile: "foot_calm"
          },
          encoded: "ygkiyAwwxhO_GpCm@_A{@ZgJzF}AbBcE|CqEpBqF|FkAmJeIq\\qBqAiM_s@_AkA_@I|BcJy@eH}DAuByI@mCuLyp@a@uAe@Sm@JyUhJm{@dWcAp@_EeEaA}IsAiHiPqmAko@zg@cCeJ{Pmz@GiB}BkGm@UoCyGkCgFeFuI_D_E_FcFkGsEqCiBkBg@_AoC}DwCsAdAiAI_d@kPmKeBkKUwU^oQSuEOk@kAq@^qEzGePvCkMtEc@tB_FjBuCLCpBqDRaAs@oI~C_B~AmAcDcJOUyHuYvM}Ie\\cOnFuFiGmCaA{EoGo@{HsFuUsEkN]wEwz@b{@eA`BiBiFsE|Dw@rBugCbhCuAh@wA?uGmC{A|EaHgCwB}CyAeEkIu\\MmA}BdHcAn@aE~M"
        },
        calm_nature: {
          routeId: "calm-round-7-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2071.785,
            durationSeconds: 1492,
            fastDurationSeconds: 1482,
            profile: "foot_calm_v1"
          },
          encoded: "ygkiyAwwxhO_GpCm@_A{@ZgJzF}AbBcE|CqEpBqF|FgBhCyl@jc@m@t@aO~J}ChDuC^gDhBmF~GiExCuC|EaDz@gIn@kD}@_GyEg@~AwEbA}FIuGbAuFg@qCwAue@q@__BBeG~CuI~BeV~KanA`o@qf@`UeFiTiLim@eC}JwNyQ{PqQSq@gFgGkE|E{DuG}h@_j@mA?}FoAsJwHePmQ`E}KLgBQ}Bs`@os@}@Y_B\\i_@le@{Yic@gBjCoS}[{Xt^_D_H{j@ygBU_F{AvHmKkFp@wFgJcDWi@g@eJoHc[gB_BcAn@aE~M"
        },
        fast: {
          routeId: "calm-round-7-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2058.599,
            durationSeconds: 1482,
            profile: "foot_fast"
          },
          encoded: "ygkiyAwwxhO_GpCm@_A{@ZgJzF}AbBcE|CqEpBqF|FgBhCyl@jc@m@t@aO~J}ChDuC^gDhBmF~GiExCuC|EaDz@gIn@kD}@_GyEg@~AwEbA}FIuGbAuFg@qCwAue@q@__BBeG~CuI~BeV~KanA`o@qf@`UeFiTaIzAO_FiG{\\cHsVaCoDaFsEiRiS}EmG{DuG}h@_j@mA?}FoAsJwHePmQ`E}KLgBQ}Bs`@os@}@Y_B\\i_@le@{Yic@gBjCoS}[{Xt^{AeD}B|CO{Acl@}jBmKkFp@wFgJcDWi@g@eJoHc[gB_BcAn@aE~M"
        }
      }
    },
    {
      pairId: "calm-route-comparison-08",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-8-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1023.171,
            durationSeconds: 737,
            fastDurationSeconds: 690,
            profile: "foot_calm"
          },
          encoded: "iy~iyAu_jgOfAfWcAEcDnHFbCkLgM_o@ggAenAmxBiE{C}MkTmLhQoB|Es@xEmIqN{Az@gBtFuSm]cH~Lg\\nu@sC}CcAD{A~CoP_SsLkPyBUyC_DeBEqQjNgEhCa@dAkMaPsMjVwU~f@tA~D"
        },
        calm_nature: {
          routeId: "calm-round-8-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1001.121,
            durationSeconds: 721,
            fastDurationSeconds: 690,
            profile: "foot_calm_v1"
          },
          encoded: "iy~iyAu_jgOfAfWcAEcDnHFbCkLgMwRl`@qE}Fgd@{u@c\\yl@}[ij@mb@mu@qFwKkAeAmIqN{Az@gBtFuSm]mPuZiAMgt@xp@cEtHyBU{V~USxDNpEaBnCmDuAuFl]eCXeGfK}FpAsIyCyDNqCyEm@cB"
        },
        fast: {
          routeId: "calm-round-8-fast",
          source: "fast",
          metadata: {
            distanceMeters: 957.966,
            durationSeconds: 690,
            profile: "foot_fast"
          },
          encoded: "iy~iyAu_jgOfAfWcAEcDnHFbCkLgMmr@pvAyFgCsDmCgBEyPiLqt@et@mAqE}@{@uBCiBaBeDmFgMaYG{CkGuN}MvFq@v@Y]_BBqBsFoBaD[xAml@lu@mFhCmDdEaFeH{b@ke@aPkPgIqF_DqN_LoWkIkKqCyEm@cB"
        }
      }
    },
    {
      pairId: "calm-route-comparison-09",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-9-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1931.843,
            durationSeconds: 1391,
            fastDurationSeconds: 1324,
            profile: "foot_calm"
          },
          encoded: "olejyAkdwgOhMkRfEmFpk@k`@tFkCwO}r@{A{FgAyBoCeLUmCsHo]wCkKd@yFlBHAkE~EstAv@uIrAmIrEmFwIqUuNyWo@SaFeGtDyFeYud@cEkTm@aI}Dr@DiMeG{~@BsD}FiItAkB`@gCCkTh@iTj@eHBsQkAmDmE_`Ak@aEVuCcAuHnC}@w@yEf@QiAiG@u@lRwh@pAaBlOeLbMgOnSa]lJwJ~IoH`OkItNmFrF}Ee@}Blb@mg@wCmMxEiNx@uGlDuE@qDQeE_EgMAeHtFqGb@JdTmXw@{@t@fBfMmVjEwJtJwX|DoPhEoOtHu@dCwn@bAsP~D}_@"
        },
        calm_nature: {
          routeId: "calm-round-9-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1918.585,
            durationSeconds: 1381,
            fastDurationSeconds: 1324,
            profile: "foot_calm_v1"
          },
          encoded: "olejyAkdwgOhMkRaBgH@}BbFuC}Uw}@sFuIfEmEjGcEcFam@tDSbJmE|@s@V{@pEqCdACvFcCd@yFlBHAkEpD_eAl@sNv@uIrAmIrEmFnD}HhIoC`m@}`@O_CtEsFmDa`@aBaL}AqNMcDF_A{A{GoEe]i@iRjR}DdAmGnTe]nBi[rCuLFyHjLkBIgL`@wCpG_CbF}FeFiMePacBf@aJ|FmMnZeTJ_Lc@yOwF_McGmRrHoQ~_@{h@uDeQzCsE_Be@oAyAcEg^mIm^dB_KgCoGNuK{@`@eEiL}DcEjEwJtJwX|DoPhEoOtHu@dCwn@bAsP~D}_@"
        },
        fast: {
          routeId: "calm-round-9-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1838.274,
            durationSeconds: 1324,
            profile: "foot_fast"
          },
          encoded: "olejyAkdwgOhMkRfEmF`VoPu@uGfD_AkIy\\dH}ENqPpHeF{A{FgAyBoCeLUmCsHo]wCkKd@yFlBHAkEpD_eAl@sNv@uIrAmIrEmFnD}HhIoCX_GfDgFhb@w^|@qAkFoj@iBoJ~FyH{A{GoEe]i@iRjR}DdAmGnTe]bFaRdQaOmAuIc@kHIgLySy_CqAiF}CyC_A_M~U_PAsHnDg^rEaQtFcIrHoQ~_@{h@uDeQzCsE_Be@oAyAcEg^mIm^dB_KgCoGNuKpBoAzA_E`Q_gAn@aJdCwn@bAsP~D}_@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-10",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-10-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2424.941,
            durationSeconds: 1746,
            fastDurationSeconds: 1458,
            profile: "foot_calm"
          },
          encoded: "_}liyA_idiOj@uD{CgKkDsF{A_FcK_d@mFoSoDjB_BNkBKyCqAyHmFkHiCcTqAy@Ne@`AkEs@eAuBuAsAyJwDcAWu@\\aMlIiQ|MgLrXoFfHwAuBkhAhbAqF\\q_@vY}C|DsAdAiAIaAdJeA~Ceb@pa@{NzOcLvN_BlAaEfHmo@t|@yAHwKnMkAjGpBrDUnCuCrCiBAoc@xo@yQfWuTnU{Bz@if@`g@}@rAm@dBc@lDAxB_EZoIpGkJyMaMlUJrI}EzHeRhRa@v@t@dGq@jBPdEApDmDtEy@tGyEhNvClMmb@lg@d@|BsF|EuNlFaOjI_JnHmJvJoS`]cMfOmOdL_GqCmCj@uPyS{At@iEnLeEdEmF|CySZqEh@qEdAoKzE{DpC}KbM_AfAiJrDyGl@p@|L`Chr@JfMpJlZ|BtKhLhTp@]|Eb@vExB"
        },
        calm_nature: {
          routeId: "calm-round-10-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2283.774,
            durationSeconds: 1644,
            fastDurationSeconds: 1458,
            profile: "foot_calm_v1"
          },
          encoded: "_}liyA_idiOGb@cCxCcBhAgO`OS|AaCjBqA\\wLlKsBzCOfA}DrDm@D_WrRsCzAin@bg@zOnrA|@`DgWpQo@jAcDjC}o@`e@oAd@wFfFmx@bl@^pGeCjDqDjDsm@td@gDtBtHzmAw@p@qFdC{G`C_HtEpB~LTzFanA`o@qf@`UwPhJeh@jVqG`Co|@rb@{FlAoZdT}FlMg@`JdP`cBdFhMcF|FqG~Ba@vCeOdEaWUgo@iCku@}Aud@{AiMhARnD_YcAmHD}Hn@eJJPx@iAbV}@rEeKwE"
        },
        fast: {
          routeId: "calm-round-10-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2024.887,
            durationSeconds: 1458,
            profile: "foot_fast"
          },
          encoded: "_}liyA_idiOGb@cCxCcBhAgO`OS|AaCjBqA\\wLlKsBzCOfA}DrDm@D_WrRsCzAieA`{@_H`EeBqE{b@h^wJfHwGlGw`Afx@uWbS}YjWsNdLiG~FaNtKsKdK_A}@iDzD}a@v]mAZsClCE|@mBzBsW|Sgp@xj@kE|EaTvZ_HbFkYjd@_k@~v@mBzAcL`P{DnDaDnAqBMmB|CoGvDsw@|{@oJtKwGxIwRnSiVMHvGuL|@sKfDaAvAWtC}DjBjB`HbFxeA_YcAmHD}Hn@eJJPx@iAbV}@rEeKwE"
        }
      }
    },
    {
      pairId: "calm-route-comparison-11",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-11-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1527.361,
            durationSeconds: 1100,
            fastDurationSeconds: 920,
            profile: "foot_calm"
          },
          encoded: "sxgjyAqshhOAkBaQiCia@fKsOe@_MhA_HxCI_GaFcD{@yQsEgAiCRuBmEoCoCgGsCyEuA}E{@wE?oC?ue@sHcGGmAgE{CDsJbE_Eh@}CUBkAcIo@_CpByoAiMsGZgI_@}SlEySfACcIsP_@}BbLiAxIo@lIEhEqDtKkGxEi@bDuKlo@{HbJ_C|AmBu@gBDyJpUwBbN{m@tkD@lCk@tEvl@zYb@iCsH{DuMtu@qKrs@"
        },
        calm_nature: {
          routeId: "calm-round-11-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1305.703,
            durationSeconds: 940,
            fastDurationSeconds: 920,
            profile: "foot_calm_v1"
          },
          encoded: "sxgjyAqshhOAkBaQiCia@fKsOe@_MhA_HxCaEnDq|@fAmFAsB]iOSsKdKaEbHiF}@YnI{Ma@]nJmBx@uK?J~EsFdCkR`Pi@nGqDrX}GrHqHhe@_^{NwB|@ih@yT{DnXaHj]}Mh_@iAjBqA]_\\i_@mGdSmCs@cNhw@iA|JeFxNw@pEsH{DuMtu@qKrs@"
        },
        fast: {
          routeId: "calm-round-11-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1277.291,
            durationSeconds: 920,
            profile: "foot_fast"
          },
          encoded: "sxgjyAqshhOAkBaQiCia@fK{B`K_IhJqCrGeK~B_@tAkIjA_Fg@[hFkN|LatAlbAaCz@cPbJ_JqEaAaBsDdBuc@oQ}GrHsWiKakA_g@sMyFyKbo@sDlRcBlAmGjCwA~Ik@@}@bEa@b@yHzm@cNhw@iA|JeFxNw@pEsH{DuMtu@qKrs@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-12",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-12-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2094.178,
            durationSeconds: 1508,
            fastDurationSeconds: 1084,
            profile: "foot_calm"
          },
          encoded: "chakyA{pwfOmFoEywAmuAqBsBwBmD{e@ge@uBcE_DkEmHmIzAiAbAoBdB{JlYgmBzAcMeByJyLkNaFeEgCf@oBfCsBtEiHoGtJgZz@mEqP}_@_E{KqI{YcBq@eDmI`CsGcd@unBcD_LcAwB~GmQkD}EiErKiKcXiIePuJgOqEdKyHsGol@e^gCmR}BgEkAjCaEqEuA|CebAsd@qArE}CeCq@oCer@oc@aRkKuPcH}Iv[GjOgB`HyK_LoOzj@qCgBqa@jyAoEsC_FpAc@}JwCkAgI}EuY{ScAa@a@vA"
        },
        calm_nature: {
          routeId: "calm-round-12-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1505.583,
            durationSeconds: 1084,
            fastDurationSeconds: 1084,
            profile: "foot_calm_v1"
          },
          encoded: "chakyA{pwfOmFoEywAmuAqBsBwBmD{e@ge@uBcE_DkEmHmI}@Coc@}b@}EgDsAiEgH}H{Bb@oZkZi]a\\_UsRas@yo@a@aBXmCeDaDcBLyAe@yWeXiP}ScEiHsEyQ?gE}AqBiAmDc@gFsCMqCt@iOiAwDeCaB~@iBJ_EyAkGkE{k@kl@aEgEc@_FgFmDkDcE_Aj@_B@}\\oNcMiD{BoFkGsK}Gsl@sA{Pc@}JwCkAgI}EuY{ScAa@a@vA"
        },
        fast: {
          routeId: "calm-round-12-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1505.583,
            durationSeconds: 1084,
            profile: "foot_fast"
          },
          encoded: "chakyA{pwfOmFoEywAmuAqBsBwBmD{e@ge@uBcE_DkEmHmI}@Coc@}b@}EgDsAiEgH}H{Bb@oZkZi]a\\_UsRas@yo@a@aBXmCeDaDcBLyAe@yWeXiP}ScEiHsEyQ?gE}AqBiAmDc@gFsCMqCt@iOiAwDeCaB~@iBJ_EyAkGkE{k@kl@aEgEc@_FgFmDkDcE_Aj@_B@}\\oNcMiD{BoFkGsK}Gsl@sA{Pc@}JwCkAgI}EuY{ScAa@a@vA"
        }
      }
    },
    {
      pairId: "calm-route-comparison-13",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-13-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2330.237,
            durationSeconds: 1678,
            fastDurationSeconds: 1574,
            profile: "foot_calm"
          },
          encoded: "{rujyAutjgOjAyDa_@_ZyBeEw@WeSgUjGqNjAy@jAsF}SuJ}q@c]]kAkCgCmAd@cAY}SiKk@yBNmAwBsCeEkDkXmKcs@{a@aUeQqGmAaBdGDtAS~CuDpK{BbIyOnOo^l[y_@xWeIvEcNvG{Dj@wF`EmT|Hm\\pH{LzLuNtAuIRuNYsFe@uI@yB{@ge@sDkAjCgCoCyDkAqn@sGqEfD{DzHcPj^yHsGol@e^gCmR}BgEkAjCaEqEuA|Cok@}W{K~WiB|BaJbTiEjNsVno@oMh_@uLfb@qJpb@yD|Ss@hCkF~ZoLcL?uAkBz@aHIuBaAcEeEsAfGq@P}DgCkEhQ_Gw@y@fOY|B_G|Jsi@zz@"
        },
        calm_nature: {
          routeId: "calm-round-13-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2277.869,
            durationSeconds: 1640,
            fastDurationSeconds: 1574,
            profile: "foot_calm_v1"
          },
          encoded: "{rujyAutjgOjAyDa_@_ZyBeEw@WeSgUjGqNjAy@i`Age@sEqA_C|@sFqEk@{@cQmJcBdAeCm@wDyBcDkE_c@qXwd@_XkHcCuN~I}^r^wT~Rk`@pX_KvF_HtCuDbC{NrGgRrGcZhHmH^sJ~AuNtAuIRuNYsFe@uI@yB{@ge@sDkAjCgCoCyDkAqn@sGqEfD{DzHcPj^yHsGol@e^gCmR}BgEkAjCaEqEuA|Cok@}W{K~WiB|BaJbTiEjNsVno@oMh_@uLfb@qJpb@yD|Ss@hCkF~ZoLcL?uAkBz@aHIuBaAcEeEsAfGq@P}DgCkEhQ_Gw@y@fOY|B_G|Jsi@zz@"
        },
        fast: {
          routeId: "calm-round-13-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2185.758,
            durationSeconds: 1574,
            profile: "foot_fast"
          },
          encoded: "{rujyAutjgOjAyDa_@_ZyBeEw@WeSgUjGqNjAy@i`Age@sEqA_C|@sFqEk@{@cQmJcBdAeCm@wDyBcDkE_c@qXwd@_XkHcCuN~I}^r^wT~Rk`@pX_KvF_HtCuDbC{NrGgRrGcZhHmH^sJ~AuNtAuIRuNYsFe@uI@yB{@ge@sDkAjCgCoCyDkAqn@sGqEfD{DzHcPj^yHsGir@ryAsWz_@iFdJyg@bv@kHxKkA\\sCMqCt@iOiAwDeCaB~@iBJ_EyAkGkE{k@kl@aEgE}BfGuBpKkFy@yGRwIb_@_Gw@y@fOY|B_G|Jsi@zz@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-14",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-14-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2050.049,
            durationSeconds: 1476,
            fastDurationSeconds: 1436,
            profile: "foot_calm"
          },
          encoded: "qrxjyAk~yeOiUe_@jPsY~DgJ~@gE^iFEsHo@oDaBgEO{EqAcHi@}HNaIx@oMeBkLe@cGKwI`@k`@iAgH}BiGaLoR_DsJaA_LcBhBiFrH{GiF_PiOxd@}tAyGwF~AqDv@qEqDi@}ImJ}BwDuPkPiL_PyDcE_BGcEeESaBgm@ii@yKcI_B|Ae@fAeIyG]dAmYqTn_@mpAiGoZlOqn@W}KuNqLrCmImDcBWy@y^q]_BeH_AeIs@{D}H}JeFgCh@yKpC{HhHsCc@_IaA_FkDiJqI_MqKoLevByqBqFwE}YsTeiA}gA{B}F"
        },
        calm_nature: {
          routeId: "calm-round-14-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2005.224,
            durationSeconds: 1444,
            fastDurationSeconds: 1436,
            profile: "foot_calm_v1"
          },
          encoded: "qrxjyAk~yeOiUe_@jPsY~DgJ~@gE^iFEsHo@oDaBgEO{EqAcHi@}HNaIx@oMeBkLe@cGKwI`@k`@iAgH}BiG{D}GnNgT|G}ObJiQfQmg@hCuDP}GdTgf@|Wqj@}RedBoBcLaBiE_DX{AaFyDmFb@iBN_DwAmQ_ByImm@_m@ycAqaA}C@eJmIiAwEiCeD_p@gn@iAKyEqE_A{Cmi@gg@kZeX}ABuA^mGcJqKoLkyBytBi^kXeiA}gA{B}F"
        },
        fast: {
          routeId: "calm-round-14-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1994.929,
            durationSeconds: 1436,
            profile: "foot_fast"
          },
          encoded: "qrxjyAk~yeOq_Au{Ayg@}t@iCyFSkCmDj@sBhEcHj@qB_GyC}CuEs@XcQ_@oHyDsHcJaLqTaZez@qlA_E]mHiKa@qFg}@{nAvBcFke@sp@[aDTsC`Oqv@|EcV~BsJV{E~Mgp@fJ{_@rOcf@bTgn@fWqs@zA_Hh@yKpC{HhHsCc@_IaA_FkDiJqI_MqKoLevByqBqFwE}YsTeiA}gA{B}F"
        }
      }
    },
    {
      pairId: "calm-route-comparison-15",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-15-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1181.745,
            durationSeconds: 851,
            fastDurationSeconds: 722,
            profile: "foot_calm"
          },
          encoded: "}a~kyAo}zgOkBwNo@eObDkB`EwF~AkG\\yPj@}FVgWrVeJnGyDve@alA`CyDcBiAwAsCuCwDe@}DyBeDeH}NiO{a@oAqBfDiE`YoXo[q}@`e@ic@|OwHyNyHe@kCnD{OuNyMmF}CGsJaS}JgAgJ{BsHgH_Q[cBQyDwAsGwI{Oy@yBe@iCcCi[_ByGuAgDuGaIkEqBs@_Ao@cCs@kGqBeGoAwEe@qIBiCXgBnFoPX_DKmEEE"
        },
        calm_nature: {
          routeId: "calm-round-15-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1002.527,
            durationSeconds: 722,
            fastDurationSeconds: 722,
            profile: "foot_calm_v1"
          },
          encoded: "}a~kyAo}zgOkBwNo@eObDkB`EwF~AkG\\yPj@}FZs_@h@{A_Ag]u@uEy@}JBuDwHm}@c@uCaIy`AoBeGcCkOzAmDHcC[aHkEoh@eBeOMmDsN}`ByAiFgC{B_AyAoCiB~L}ToEuGsD_IgBoBh@oEuEuPk@qDYwD?yGpBkb@dGeAbCEh@HrDlCtB`ApDf@zCa@|DcCdBkHoAwEe@qIBiCXgBnFoPX_DKmEEE"
        },
        fast: {
          routeId: "calm-round-15-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1002.527,
            durationSeconds: 722,
            profile: "foot_fast"
          },
          encoded: "}a~kyAo}zgOkBwNo@eObDkB`EwF~AkG\\yPj@}FZs_@h@{A_Ag]u@uEy@}JBuDwHm}@c@uCaIy`AoBeGcCkOzAmDHcC[aHkEoh@eBeOMmDsN}`ByAiFgC{B_AyAoCiB~L}ToEuGsD_IgBoBh@oEuEuPk@qDYwD?yGpBkb@dGeAbCEh@HrDlCtB`ApDf@zCa@|DcCdBkHoAwEe@qIBiCXgBnFoPX_DKmEEE"
        }
      }
    },
    {
      pairId: "calm-route-comparison-16",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-16-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1887.721,
            durationSeconds: 1359,
            fastDurationSeconds: 1184,
            profile: "foot_calm"
          },
          encoded: "u|{iyAoqpfOiPqXcXg_@g@qDkAiAaz@{j@mc@ka@aRsY?aAj@eDy@}ErS{JgOu}@L{AaAgEk@Y}Qku@QwBcCuAgGwWo@oFAkAfIyNxEwKHm@`F{DbS_MhCsBnD}D?w@rDqAtHuA~Ag@b@i@_AqDsAE]yOt@wPaRgCsBoAfA{DjCsCr@qCwCgGfEaFeHaQcOy\\~CcEfq@sq@mBkD_AcDbDaIsDkEiN{Jq]aZ{GaItCoJhq@utAe_@{l@}zAskCgG}LGeGkEuHoAsA{Yee@"
        },
        calm_nature: {
          routeId: "calm-round-16-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1794.794,
            durationSeconds: 1292,
            fastDurationSeconds: 1184,
            profile: "foot_calm_v1"
          },
          encoded: "u|{iyAoqpfOiPqXcXg_@gCc@c_Acn@gAU_ARaCaDQoAyAeCiPgOwKuNoi@wz@qKwTkAoGhCqA_^}u@k@_Fh@uCj@mAwCqJqHkhA_FsXk@aFq@cMBqAn@uClAkAbCwA|C{@hDWCcE`AqG{@uDwDiDsBuTSeYDkIj@eLq@}AQoUy@_Dj@_DeEcJxS}Xbj@_p@nC{EDeBhCj@~D`InCmAfAZlIeYhq@utAe_@{l@}zAskCgG}LGeGkEuHoAsA{Yee@"
        },
        fast: {
          routeId: "calm-round-16-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1644.555,
            durationSeconds: 1184,
            profile: "foot_fast"
          },
          encoded: "u|{iyAoqpfOiPqXcXg_@gCc@c_Acn@gAU_ARaCaDQoAyAeCiPgOwCkD_GiI{Su\\fBwCoRiZ{CqFwC_JWqCsDuF_^}u@k@_Fh@uCj@mAwCqJqHkhA_FsXk@aFq@cMBqAn@uClAkAbCwA|C{@hDWCcE`AqG{@uDwDiDsBuTSeYDkIj@eLq@}AQoUy@_Dj@_DeEcJnBuCI_DiX}m@gCoJsQab@nM}N~AsEjFk`@vAyHnA{@qB{HaC{CCkBqUah@oByB_BBqBsFoBaDxAiIcA}IbBmDb@kG`BoCpOayAy@wEfBuFzA{@lRs_@{IoPEeBMO"
        }
      }
    },
    {
      pairId: "calm-route-comparison-17",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-17-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1390.304,
            durationSeconds: 1001,
            fastDurationSeconds: 913,
            profile: "foot_calm"
          },
          encoded: "_fgjyAml}fOwCwF_H}Pd@sEwAmDmAJ}@s@sBmEwTcm@uAeBoQaj@AaCeBaHmE~DuHoV}CyGuDgKkBiBiEsP[oCcJs[qFwYmAqEs@aLcDiVp@w@g@aG}NqiAoPw_BoHkv@o@uAgAYuAfAg@dBmE}CxAmP_Cg@gNpBiAnFwSi]}AbBgGsPwY{e@cBpAcCcFt@aCmXob@mBcEkUc_@oAc@yE`HcRd\\{HhOsB~BmDtG_AkAkAq@}HoJs[wi@"
        },
        calm_nature: {
          routeId: "calm-round-17-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1272.099,
            durationSeconds: 916,
            fastDurationSeconds: 913,
            profile: "foot_calm_v1"
          },
          encoded: "_fgjyAml}fOwCwF_H}Pd@sEwAmDmAJ}@s@sBmEwTcm@uAeBoQaj@AaCeBaHmE~DuHoV}CyGuDgKkBiBiEsP[oCcJs[qFwYmAqEs@aLcDiVqL_HkXkQcFsDy@sAiQkLsIaFiCJmU}O?oBv@oDmIwEy@pDaKwLur@slA}AiHsFcKeBHaNmU?oBwCiFu@Bq@]aYof@yBoE_Aq@yOoXc@gD_CsCtXue@}HoJs[wi@"
        },
        fast: {
          routeId: "calm-round-17-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1268.132,
            durationSeconds: 913,
            profile: "foot_fast"
          },
          encoded: "_fgjyAml}fOwCwF_H}Pd@sEwAmDmAJ}@s@sBmEwTcm@uAeBoQaj@AaCeBaHmE~DuHoV}CyGuDgKkBiBiEsP[oCcJs[qFwYmAqEs@aLcDiVqL_HkXkQcFsDy@sAiQkLzC_QbC{DgCuD`@_Ba`@uWzFaV_HqF~CkKeGmL}j@q`AaBbAuD}Jf@i@uw@usA{CdFiAnAu@wBsV}[_AkAkAq@}HoJs[wi@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-18",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-18-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2428.931,
            durationSeconds: 1749,
            fastDurationSeconds: 1397,
            profile: "foot_calm"
          },
          encoded: "}{bjyAcqlgOxRt\\b\\xl@fd@zu@pE|FvRm`@vb@be@tV`TxW~PvXzM`RtGpGfExd@rEvFwAda@~@jUk@l]kB`yAeSfH_CtBwAWmBnIkGbEpNvH~[hSkExLiBvcA_UC`DdKjb@dEfk@~UiCz@`CpDz\\dChObE|As@~GMhNSdEW~@dCtEhXnwAD`I~Exp@qC|YeFhFyHlEgSbHxB~ZcC`LzAbR|AxDxA`GrBnOd@fH@rDSxDu@|D}JfLmA`Co@bBc@vCIvCRvBb@lA~EnIzAfEvClRyNxFlGdD~VbKfGr@hLrDrOzG|M~H~v@dZoA~J`LlE"
        },
        calm_nature: {
          routeId: "calm-round-18-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1961.794,
            durationSeconds: 1412,
            fastDurationSeconds: 1397,
            profile: "foot_calm_v1"
          },
          encoded: "}{bjyAcqlgOxRt\\b\\xl@fd@zu@pE|Fu^bu@uCnJzG`Ip]`ZhNzJrDjEjA`D|CvDdEzDhNbKhInFzMnGhFNfEWbB`LpF|@L`Eb@h@xS~LfLxHfCzBnp@hv@l@Br@[rBbCIhATdAdq@~v@pBtC|x@||@xl@`s@pGvGvEjD|EjCfGzBjNnDfOpCzs@|HvAOpB{@|@dM`JlOnDeGrC|Epf@l`A|K|PzKxIlGdD~VbKfGr@hLrDrOzG|M~H~v@dZoA~J`LlE"
        },
        fast: {
          routeId: "calm-round-18-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1939.971,
            durationSeconds: 1397,
            profile: "foot_fast"
          },
          encoded: "}{bjyAcqlgOxRt\\b\\xl@fd@zu@pE|Fu^bu@uCnJzG`Ip]`ZhNzJrDjEjA`D|CvDdEzDhNbKhInFzMnGhFNfEWbB`LpF|@L`Eb@h@xS~LfLxHfCzBnp@hv@l@Br@[rBbCIhATdAdq@~v@pBtC|x@||@xl@`s@pGvGvEjD|EjCfGzBjNnDfOpCzs@|HvAOpB{@|@dM`JlOdj@zeA~CxHpD`FzKbKvHhFdYtLjKjG`ZdLjLpCfgA~a@"
        }
      }
    },
    {
      pairId: "calm-route-comparison-19",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-19-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1995.2,
            durationSeconds: 1437,
            fastDurationSeconds: 1345,
            profile: "foot_calm"
          },
          encoded: "{zzjyAo||fOzXd\\mXpq@KnCeBtG}A~A}h@xqAQzE_LnBcApAah@rIsDZsEvAkCyOkEwS_IpDk@S_BbBmTvGaM\\mIsAeIwDmMsKywAmuANgCk@MA`EqA~G}DgFwCjKmOd_AaTjmAkK`o@cKtj@eSbp@_IhLqCZuSvMeYr@a[kKuaA_q@{KvAiOwCya@aYaGwGeAwG}ByDaFwKsXz@w[KqBdNNzF`AjCiGdOwHuIeCdMoEhXcEb["
        },
        calm_nature: {
          routeId: "calm-round-19-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1887.003,
            durationSeconds: 1359,
            fastDurationSeconds: 1345,
            profile: "foot_calm_v1"
          },
          encoded: "{zzjyAo||fOgM_O}Rlo@G`C_BrDqIuH{L`_@sLrZsW~m@iBE{BdCqAvF_F`EgUjO_BbBmTvGaM\\mIsAeIwDmMsKywAmuANgCk@MA`EqA~G}DgFwCjKmOd_AaTjmAkK`o@cKtj@eSbp@_IhLqCZuSvMeYr@a[kKuaA_q@{KvAiOwCya@aYaGwGeAwG}ByDaFwKsXz@w[KqBdNNzF`AjCiGdOwHuIeCdMoEhXcEb["
        },
        fast: {
          routeId: "calm-round-19-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1867.987,
            durationSeconds: 1345,
            profile: "foot_fast"
          },
          encoded: "{zzjyAo||fOgM_O}Rlo@G`C_BrDqIuH{L`_@sLrZsW~m@iBE{BdCqAvF_F`EgUjO_BbBmTvGaM\\mIsAeIwDmMsKisA{pAaGeGwBmD{e@ge@uBcE_DkEmHmI}@Coc@}b@}EgDaLb[qCgBoIuJqz@fvBqd@aZqCiAiq@bYwKj@kFbKe@pFaOpq@{Hf\\oTyMgK|AY~AiHHYfMe@tIiCfRe[n`BoEhXcEb["
        }
      }
    },
    {
      pairId: "calm-route-comparison-20",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-20-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1480.361,
            durationSeconds: 1066,
            fastDurationSeconds: 956,
            profile: "foot_calm"
          },
          encoded: "}zajyAkjvgODc@cCDiBfBqCcFwEeUwSo|@m@aA{A_GK_BoL}g@{A{FgAyBoCeLUmCsHo]wCkKd@yFoJqa@gBwHcGwKmImReCoA}FmNeAsAq@M}EgJsSid@qDqGnBuBq]eu@oAqLgTvGqBkLy]lKiF{TsE}B}Mw]sMec@kN|LatAlbAaCz@cPbJ_JqEaAaBsDdBuDyAe@nLk~@{^ar@}YkEnY"
        },
        calm_nature: {
          routeId: "calm-round-20-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1369.667,
            durationSeconds: 986,
            fastDurationSeconds: 956,
            profile: "foot_calm_v1"
          },
          encoded: "}zajyAkjvgODc@cCDiBfBqCcFwEeUwSo|@m@aA{A_GK_BoL}g@{A{FgAyBoCeLUmCsHo]wCkKd@yFoJqa@gBwHcGwKmImReCoA}FmNeAsAq@M}EgJsSid@qDqGnBuBq]eu@oAqLgTvGqnA|[mp@nAyk@NiFm@yHqEm[}MuDaCk~@{^ar@}YkEnY"
        },
        fast: {
          routeId: "calm-round-20-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1327.42,
            durationSeconds: 956,
            profile: "foot_fast"
          },
          encoded: "}zajyAkjvgODc@cCDiBfBqCcFwEeUwSo|@m@aA{A_GK_BoL}g@{A{FgAyB}@c@u\\zIuIzCyHhHiBfCsFuIcBj@cMmSgJmMoRi]ImAuAgCmB{AoO_XgA}@yLwSaLuRsNwXgb@ks@aGwOgGsJW}Ymp@nAyk@NiFm@yHqEm[}MuDaCk~@{^ar@}YkEnY"
        }
      }
    },
    {
      pairId: "calm-route-comparison-21",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-21-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 1552.847,
            durationSeconds: 1118,
            fastDurationSeconds: 1118,
            profile: "foot_calm"
          },
          encoded: "_`~kyA_plgOeD~P}ExYaEhd@i@jMUzO?dSp@~m@DdVi@bLaB|OaBxL{G|YeCfIl\\nQWdG~N~k@JvCe@dGfAxAn@tN`@rPnAFXYtAGjFl@vAfDtAfGh@|IHzLw@dL_BvIiDpGCjKV`Dk@hOxArDdB{ChHaREdLTzKdUr@nLdE[zErBp@b@_DrXtJ~HlA`[aDk@dfBFbOpAb@x@vIh@pCzAnDnEvE`AbB|@{DnCMpGsAbDItO`E?WcAk@Fa@bBd@`CrCz@b@pCvCgCbZwDt\\gCf@_Ifi@zFlC~CMpBr@hEpCvCz@rApBtDhAf@vBj@a@vAcCdBZ]~CLfCrHvE?_En@qF"
        },
        calm_nature: {
          routeId: "calm-round-21-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1704.413,
            durationSeconds: 1227,
            fastDurationSeconds: 1118,
            profile: "foot_calm_v1"
          },
          encoded: "_`~kyA_plgOeD~P}ExYaEhd@i@jMUzO?dSp@~m@DdVi@bLaB|OaBxL{G|YyGeCuBrF_GpTo@vEcJva@eFlYeDpWfFd@zF`q@x@hDx@~AbA~@zCpCp@pArS`u@jAfDlAr@lAIpDmC~@B^XnC~ExCe@tApH|BB`IcIvDuEbCyDxArDdB{ChHaREdLTzKdUr@nLdE[zErBp@b@_DrXtJ~HlA`[aDrCPFqBl@m@xEHzScA|HuDk@vJWjf@kAnRpDk@tCbBdApB|AtMsAnN]pJd@zCYzD|CfExCcEbCxDnBl@mCp_@gCbZwDt\\gCf@_Ifi@zFlC~CMpBr@hEpCvCz@rApBtDhAf@vBj@a@vAcCdBZ]~CLfCrHvE?_En@qF"
        },
        fast: {
          routeId: "calm-round-21-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1552.847,
            durationSeconds: 1118,
            profile: "foot_fast"
          },
          encoded: "_`~kyA_plgOeD~P}ExYaEhd@i@jMUzO?dSp@~m@DdVi@bLaB|OaBxL{G|YeCfIl\\nQWdG~N~k@JvCe@dGfAxAn@tN`@rPnAFXYtAGjFl@vAfDtAfGh@|IHzLw@dL_BvIiDpGCjKV`Dk@hOxArDdB{ChHaREdLTzKdUr@nLdE[zErBp@b@_DrXtJ~HlA`[aDk@dfBFbOpAb@x@vIh@pCzAnDnEvE`AbB|@{DnCMpGsAbDItO`E?WcAk@Fa@bBd@`CrCz@b@pCvCgCbZwDt\\gCf@_Ifi@zFlC~CMpBr@hEpCvCz@rApBtDhAf@vBj@a@vAcCdBZ]~CLfCrHvE?_En@qF"
        }
      }
    },
    {
      pairId: "calm-route-comparison-22",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-22-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2313.691,
            durationSeconds: 1666,
            fastDurationSeconds: 1468,
            profile: "foot_calm"
          },
          encoded: "eygjyAs~{hOtAwGdCPvSi_AcAc@~CuPg@eJoHc[gB_BqBiF`@aBAwA_ZykA_@a@mAoEIaCqN}j@uA_AiAHel@p_@uAwEi[_u@_@mBgBcDcB_@w\\qx@mRgc@oz@rbAw@nBoDpCcBb@{n@lu@aBmFuXem@yI{OhHsS_QsP{Xpj@yE}FoFjJgB_CeEpIy@v@oc@ak@s@YsCI{WlGaEdCsBxBgBnCyAoDEcGkDaY_@m@q@Q}CyEhAwCf@{Dm@uGwHye@cBjA_m@lUwCsGmKeNiAuCoD{DaDtEcCaCuDiA}DA{Bf@agB~x@{Br@gB}DaMu\\iLsMwBkHwP{XmBuGaDwBuYgc@IoEu@gEuD}GFiAxDuK"
        },
        calm_nature: {
          routeId: "calm-round-22-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 2048.156,
            durationSeconds: 1475,
            fastDurationSeconds: 1468,
            profile: "foot_calm_v1"
          },
          encoded: "eygjyAs~{hO_AzGPbWf@|A~NtHcKtf@gYyWkDh@ao@yl@cGkD_F{@aGXqSrGqD{AcBiCiQ_s@{DzBk@MkARkOhKs@AcXmh@cEeH]b@we@`QmD{DsKbA_@aJ{BwNeCoHeF{IcEyDqM_Jg[}U_Ba@cBGcBT}Ap@{ByJlAiAiA}BqFiGgByEyAaBqQgMeI}MWcBwDcFce@waA_PkXmDoAgHsA_H_@qB_@}N~n@eFdQ}CyAiBMqN{JmBuBiKqH}BqFkDwEcCtBwH}EeEeD_ByAmMkPgB}@yXy\\_BmFsIvRqDqDsD[iH{G_DkBmNgDqAkBw@mFoAuCaAoAiEwCsDiE{CqFcTqj@iLsMwBkHwP{XmBuGaDwBuYgc@IoEu@gEuD}GFiAxDuK"
        },
        fast: {
          routeId: "calm-round-22-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2038.989,
            durationSeconds: 1468,
            profile: "foot_fast"
          },
          encoded: "eygjyAs~{hO_AzGPbWf@|A~NtHcKtf@gYyWkDh@ao@yl@cGkD_F{@aGXqSrGqD{AcBiCiQ_s@{DzBk@MkARkOhKs@AcXmh@cEeH]b@we@`QmD{DQqKdAwG?mCeQ}Y_KoMgI{GuBrAaAGwIuFkSiO_B{DkEWsBCsBaBoG_HwBQyAaBqQgMeI}MWcBwDcFkh@_gAuD`d@yAd@qHsBaJbDwIcEaP{KeFdQ}CyAiBMqN{JmBuBiKqH}BqFkDwEcCtBwH}EeEeD_ByAmMkPgB}@yXy\\_BmFsIvRqDqDsD[iH{G_DkBmNgDqAkBw@mFoAuCaAoAiEwCsDiE{CqFcTqj@iLsMwBkHwP{XmBuGaDwBuYgc@IoEu@gEuD}GFiAxDuK"
        }
      }
    },
    {
      pairId: "calm-route-comparison-23",
      scenario: "Two blinded walking routes with the same start and destination.",
      routes: {
        calm_quiet: {
          routeId: "calm-round-23-calm-quiet",
          source: "calm_quiet",
          metadata: {
            distanceMeters: 2166.716,
            durationSeconds: 1560,
            fastDurationSeconds: 1422,
            profile: "foot_calm"
          },
          encoded: "oerkyAiy|hOcD`A\\tYwDtOwA`BuAdJAtGfChd@fCd_@s@dDvA`I~@dD|BhV`BfMrB`MnKlg@fFjRbFxOvFhOrIhS`Ubg@j@pCt@jLuIfB~KhUl@ng@x@xXnC|PN|KjDtS\\xFwANh@vHfDg@xGU|ADrAn@UfCqgAv|AqDnDr]hb@fAvBc@bBe[`b@}NdQhBfEoFnGyCbFa@pD~KhBY~Mj@zA]bBlE`XOnEwA~HcDhI{CnDgC`HgX`_@{FlE{V`]sA`FeRjTwCrC|@tEk_@za@^XxOdg@dRlj@iPrLyIxEjAxEpAdCpMtd@VvBmBjLoXbuAy@`CgE|VkApFaCnEwAJeGxWnIxAsBl`@sJkB"
        },
        calm_nature: {
          routeId: "calm-round-23-calm-nature",
          source: "calm_nature",
          metadata: {
            distanceMeters: 1980.545,
            durationSeconds: 1426,
            fastDurationSeconds: 1422,
            profile: "foot_calm_v1"
          },
          encoded: "oerkyAiy|hOcD`A\\tYwDtOwA`BuAdJAtG_EnAwBdB}AtCiEvMqAlB}AvAeBz@cDf@_G{@mJnSsFhTmFp\\mEta@_AdF_A|CsGvLs@vCKlBFnBjDfPRxEu@vH}BdMjAff@nAly@`EC~B|Q}Fn@wBhCfCtB]jQKnQLtC[b]F~CSlMg@lDqAzfAbBnE}@lGzJrDkB|Oh@rUk@rb@~Gb@Ejh@JjUm@xLnFrFo@hHzApj@t@fJbA`DlBxD{BpEjB|IyAdAq@nBrAl\\fA~c@z@|Ub@tE}BrCfd@fhAtAzFsPtRuPnQiPrLyIxEjAxEpAdCpMtd@VvBmBjLoXbuAy@`CgE|VkApFaCnEwAJeGxWnIxAsBl`@sJkB"
        },
        fast: {
          routeId: "calm-round-23-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1974.394,
            durationSeconds: 1422,
            profile: "foot_fast"
          },
          encoded: "oerkyAiy|hOcD`A\\tYwDtOwA`BuAdJAtG_EnAwBdB}AtCiEvMqAlB}AvAeBz@cDf@_G{@mJnSsFhTmFp\\mEta@_AdF_A|CsGvLs@vCKlBFnBjDfPRxEu@vH}BdMjAff@nAly@`EC~B|Q}Fn@wBhCfCtB]jQKnQLtC[b]F~CSlMg@lDqAzfAbBnE}@lGzJrDkB|Oh@rUk@rb@~Gb@Ejh@JjUm@xLnFrFo@hHzApj@t@fJbA`DlBxD{BpEjB|IyAdAq@nBrAl\\fA~c@z@|Ub@tEic@nf@^XxOdg@dRlj@iPrLyIxEjAxEpAdCpMtd@VvBmBjLoXbuAy@`CgE|VkApFaCnEwAJeGxWnIxAsBl`@sJkB"
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
