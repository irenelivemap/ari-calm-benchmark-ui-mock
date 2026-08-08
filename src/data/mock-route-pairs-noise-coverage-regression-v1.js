(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.AriCalmBenchmarkNoiseCoverageRegressionRoutePairs = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // HAND-AUTHORED — not produced by scripts/build-calm-route-corpus.mjs and
  // not covered by its "do not edit by hand" contract, because that
  // generator requires full per-route diagnostics (metric_averages for
  // tree_canopy, green_space, proximity_to_water, noise_exposure,
  // main_road_exposure, accident_risk, cross-checked against a paired
  // GeoJSON export) that this comparison does not have — it only has
  // geometry, distance, and duration from a local before/after regression
  // run against the noise-coverage routing fix.
  //
  // NOT WIRED INTO THE APP. index.html only ever reads
  // window.AriCalmBenchmarkMockRoutePairs, gated by an exact match on
  // corpusVersion === 'calm-curated-v2' and array length === 23
  // (see the calmRouteCorpusReady check in index.html), with
  // corpus-version-keyed localStorage/Supabase queue keys baked into the
  // same file. This module intentionally does not touch any of that — it
  // attaches to its own global, AriCalmBenchmarkNoiseCoverageRegressionRoutePairs,
  // and nothing currently loads or reads it. See the PR description for two
  // sketched options to make it playable, both deferred to a maintainer
  // decision rather than done here.
  //
  // ROUTE KEYS ARE NOT THE USUAL calm_quiet/calm_nature/fast CONTRACT.
  // This is a before/after comparison of ONE profile (foot_calm) against
  // itself across a code change, not a comparison of two different calm
  // profiles. Keys are named for what they actually are:
  //   original_corpus       — the route as published in the running
  //                            calm-curated-v2 corpus (mock-route-pairs.js)
  //   fixed_noise_coverage   — the same profile, same PBF, after the
  //                            noise-coverage fix
  //   fast                   — unchanged control (foot_fast never
  //                            references noise, confirmed byte-identical
  //                            in the regression run)
  // If a maintainer wires this in as a real Calm Route Comparison round,
  // decide deliberately which slot (calm_quiet or calm_nature) each of
  // original_corpus / fixed_noise_coverage should occupy — do not assume.
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
      pairId: "calm-noise-coverage-regression-01",
      originalPairId: "calm-route-comparison-01",
      sourceRound: 1,
      originLabel: "Oerlikon",
      destinationLabel: "Oberstrass",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-01-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 2319.282,
            durationSeconds: 1670,
            fastDurationSeconds: 1441,
            profile: "foot_calm"
          },
          encoded: "uoplyA_e~hOX}@zN{{@hOfIhWjNx@xAbC`AdBIhWtQzAvA}@rDhD`Cl@}Bf\\`M~[|LzAfCmKvo@hFn@jBs@bc@xDrIv@xZ|B`P`BzV~B~MpAxOvAlCdAhDSpRjAzSD?sAz@sBhVcBxMeATsCm@sAu@i@zADtI{HhD}E|G{H`BqBjBuBoRye@uCwEnA_ArWwZxA@tj@_o@bA_@hBB|B`BvQhb@x@}BdEkPdH{R`B_GlEjHxGdNzF_B|DB~@NvP`IbAh@b_@|HvRhDn_@xEvHb@hMFtBh@xQxI~LxDx^~H~JpCzEnBdb@lPf_@rMtJbEnJ|EfJvF|InGrEIrEP~HnA|HlCnHfExZ|SAtGfChd@fCd_@s@dDvA`IkCjBsM~T"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-01-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 2319.236640028961,
            durationSeconds: 1669.852,
            fastDurationSeconds: 1440.821,
            profile: "foot_calm"
          },
          encoded: "uoplyA_e~hOX}@zN{{@hOfIhWjNx@xAbC`AdBIhWtQzAvA}@rDhD`Cl@}Bf\\`M~[|LzAfCmKvo@hFn@jBs@bc@xDrIv@xZ|B`P`BzV~B~MpAxOvAlCdAhDSpRjAzSD?sAz@sBhVcBxMeATsCm@sAu@i@zADtI{HhD}E|G{H`BqBjBuBoRye@uCwEnA_ArWwZxA@tj@_o@bA_@hBB|B`BvQhb@x@}BdEkPdH{R`B_GlEjHxGdNzF_B|DB~@NvP`IbAh@b_@|HvRhDn_@xEvHb@hMFtBh@xQxI~LxDx^~H~JpCzEnBdb@lPf_@rMtJbEnJ|EfJvF|InGrEIrEP~HnA|HlCnHfExZ|SAtGfChd@fCd_@s@dDvA`IkCjBsM~T"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-01-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2001.091,
            durationSeconds: 1441,
            profile: "foot_fast"
          },
          encoded: "uoplyA_e~hOuC|IpGzHdHrGtHfFrSjLoCxV}@lBlQbF`D}@hEzCb@nAtFnBfBUdf@dR|BbCvNxEv@{BlFjAGxC~@tAvn@|UtEnBxF\\dP`KfFxEbBfElJlMnDzGpK|TfF|H`GlEfEhChB~C`F`CpL`@zIk@z@g@l@sB`Ee@d@v@t@T`AIjzAmd@dDaBbBmDdCdAhEmC|CUdJeFtFyBlFe@~CNzCn@`C_A`C_EpKrSbL|RhSzZtDa@xBh@fKvHj@NxAF|CYtEjE`\\zRpUt^tHvJlEtGfOw@`Gb@fJtHnSnTpDnArOe@fNiP`A}@hAa@xNq@~TqKbO_EhB_AjHaHbHgFjEkEh@iAtc@wHlAjAhKoGzK}I`KuKzIwLhBpDbWic@"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-03",
      originalPairId: "calm-route-comparison-03",
      sourceRound: 3,
      originLabel: "Unterstrass",
      destinationLabel: "Rathaus",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-03-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 2142.57,
            durationSeconds: 1543,
            fastDurationSeconds: 1277,
            profile: "foot_calm"
          },
          encoded: "sqfkyAokghOrHoEyAaDeAeEiAaE}G_SaFyOgCyHvDyBcAmE}BwCiMyk@y@}ElgAmz@tB}@pDuCn@kAvN{KbCc@hJeEa@qFzrAwSfCs@~DeCdDaEtKsUtEaIxEwF`MEx@aHrd@_@lFDjSGxDjAfIQhn@__@~@jE|Jpc@Ch@lb@wTv]qUd[qP`AjDpn@q\\ds@o_@dKmE`D^nGgBdDu@pDzCxD~VxQmDdJnFlb@{LbQiKb@dCnCzAv@WfAgE[kChZqM`KoF`GoCbVyKhFgBxQuFxKi@bC\\~Bz@vBvAjBrBjFpIjD|KEpBLfGbAvRtBxNtBXnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-03-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 1788.8671753270971,
            durationSeconds: 1287.986,
            fastDurationSeconds: 1276.79,
            profile: "foot_calm"
          },
          encoded: "sqfkyAokghOrHoEyAaDfCqBvWyOdJuGzHwFxRoOvVoO|GeEzNwIxUqKbDy@jBiAvDmDjA`G~Q~MpLtFpNpCzIj@~Fe@bYkGb[kFvLaEvLmIzWqQxScMrIiEhScLlAw@v[aMxMkEhYmIpGsAvKeAht@_F|Ga@~Ec@v[uKR}Cu@}BR}KzBg@dIeJtEoChAmC`QaJdHyDj~@cg@hMaJ`Ab@hMoHrAIlCxKtFmDl@w@|b@o]xBgBdAbF~S}OfJcIdJaGhA|FnJeDnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-03-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1773.356,
            durationSeconds: 1277,
            profile: "foot_fast"
          },
          encoded: "sqfkyAokghOrHoE`BqAs@aEvWyOdJuGzHwFxRoOvVoO|GeEzNwIxUqKbDy@jBiAvDmDjA`G~Q~MpLtFpNpCzIj@~Fe@bYkGb[kFvLaEvLmIzWqQxScMrIiEhScLlAw@v[aMxMkEhYmIpGsAvKeAht@_F|Ga@~Ec@v[uKtBjFbEkEhGoLjCmMnBdCjA_CdBe@hMeGBwBhAaB|f@yWja@wTbDcBjR_LzBo@tFmDl@w@|b@o]xBgBdAbF~S}OfJcIdJaGhA|FnJeDnBwA`TiE|A@bC|@t@nCpFpCpALpAQlBoAzA_D"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-05",
      originalPairId: "calm-route-comparison-05",
      sourceRound: 5,
      originLabel: "Höngg",
      destinationLabel: "Werdwies",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-05-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 2323.967,
            durationSeconds: 1673,
            fastDurationSeconds: 1571,
            profile: "foot_calm"
          },
          encoded: "}__lyA_cjfOv@tIH~F~Db@VwCxOwS|CwFnE{KbDaMlM{q@la@~RBpJzBfAjAaFf@h@tBeER|@MbEhAeAxI~DgBvIfPdJrCkAwQf|@tLvHtOzL~BjB`KjHh\\nOnCrAzRfJgKxj@sAo@k@Fy@p@uGhYjHrEtAaGpUhBfGd@yAd_AeG~j@_JvRhh@d\\pI~MvIbDlHtDfIdA|IUzDr@pB|@pBrhAX|KTpNV~LGzHa@fL[bFWpGWhDe@tGq@bKYjKUfM?rOCbOPj\\h@t^lBn}@lBzy@TjQ`@jj@FrOOvc@a@t[u@bMiBpI~BtBOlJIzDsAlF~@bB`@jCQtKiAvc@_Bv]gBb\\eF`m@{@\\_AvKs@tDk@lJp_@pPx@qFGkCS{DzAqL"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-05-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 2390.319219944629,
            durationSeconds: 1721.031,
            fastDurationSeconds: 1571.026,
            profile: "foot_calm"
          },
          encoded: "}__lyA_cjfOv@tIH~F~Db@g@tFeBfL}CbJcKnWoEdJEdBdIcHjE|Hh@|A\\pCHlFb@lDfAdArDn@~@vAJnBkB`Oo@|B_AlBgAbGdAbC`@`DIhDs@tCkBlDgWd[mHlK~AxBnDv@l@vJkB|@qDlN~MjQbMbSvDdHxAzDb@hAdFqAfHjP~GfObDtOhDpL{ArKfAfCrArBl\\nUbFeCpBhKV`CjEpJvR`QbXmZ|UcZpQwYdIeQpI{UpDiLtAsFj@cQd@aAl@Khh@d\\pI~MvIbDlHtDfIdA|IUzDr@pB|@pBrhAX|KTpNV~LGzHa@fL[bFWpGWhDe@tGq@bKYjKUfM?rOCbOPj\\h@t^lBn}@lBzy@TjQ`@jj@FrOOvc@a@t[u@bMiBpI~BtBOlJIzDsAlF~@bB`@jCQtKiAvc@_Bv]gBb\\eF`m@{@\\_AvKs@tDk@lJp_@pPx@qFGkCS{DzAqL"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-05-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2181.994,
            durationSeconds: 1571,
            profile: "foot_fast"
          },
          encoded: "}__lyA_cjfOv@tIH~FSdHe@zDw@rDoNf_@qFjKrCpBEdBdIcHjE|Hh@|A\\pCHlFb@lDfAdArDn@~@vAJnBkB`Oo@|B_AlBbIzBeEzW}AjEsYj^cB~DWlEl@vJkB|@qDlN~MjQbMbSvDdHxAzDb@hAdFqAfHjP~GfObDtOhDpL{ArKfAfCrArBl\\nUqPj\\cNtYkBlFuElPHzDiJ`^wGf[\\dDoIjh@qFpZWHcCbN_EzXiNjxAoFvi@gBvX?~Bh@tDt@dB`AnA}A|O~KzBlh@nNrCpAtAvBd@bGxBlJhClH`DhE`EtC|UpGxElArb@xLzCxAjAp@p@tAAzCtFjDvCwA|ClBpFbG|MjRhf@|p@vBxDv`@bi@x@zAbAnGvOnSpD`AhAqIzDdAd@dCv@lBdNfRbBfDlANnAMjAg@`AaAk@lJp_@pPx@qFGkCS{DzAqL"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-09",
      originalPairId: "calm-route-comparison-09",
      sourceRound: 9,
      originLabel: "City",
      destinationLabel: "Hottingen",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-09-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 1991.72,
            durationSeconds: 1434,
            fastDurationSeconds: 1324,
            profile: "foot_calm"
          },
          encoded: "olejyAkdwgOhMkRfEmF`VoPnT{NtFkC{A_GK_BoL}g@{A{FgAyBoCeLUmCsHo]wCkKd@yFoJqa@gBwHcGwKmImReCoA}FmNeAsAq@M}EgJsSid@vDuEsCoIzUm_@}BqWeG}UdBmFwAkI{GsT{HuSrFgL}GqOZgCtBaAP{@yEmVWaGFw@f@m@~D_@zNqOS_BRcRs@eApARSoDoEi`AkBaH|DkBVuCcAuHnC}@w@yEf@QiAiG@u@pO{b@zA{DpAaBlOeLbMgOnNeV~C{ElJwJ~IoH`OkItNmFrF}Ee@}BjMcOhKuMvGsHwCmMxEiNx@uGlDuE@qDQeE_EgMAeHtFqGb@JrJwLpHuJw@{@t@fBfMmVjEwJ|B}GvFyO|DoPhEoOtHu@dCwn@bAsP~D}_@"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-09-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 1993.5913256601555,
            durationSeconds: 1435.384,
            fastDurationSeconds: 1323.585,
            profile: "foot_calm"
          },
          encoded: "olejyAkdwgOhMkRaBgH@}BbFuCuI{[gK{`@sFuIfEmEjGcEcFam@tDSbJmE|@s@V{@pEqCdACvFcCd@yFlBHAkEdCyq@j@eRl@sNv@uIrAmIrEmFnD}HhIoC~GqE`d@kZO_C~BaCtAqBm@cHzHgIQk@_Ar@_@QnyAirAiEeLmJsT_CqBxAeN|D_DaDkIiBsMoB{WaB}N{B}NsCqLeFiMePacBf@aJ|FmMnZeTJ_Lc@yOwF_McGmRrHoQ~_@{h@uDeQzCsE_@Ea@M]Q[Y[[Wc@qKeTqImRuA[]qHVmEw@gFkE_IuD{EwAsEkCqEp@~BfMmVjEwJ|B}GvFyO|DoPhEoOtHu@dCwn@bAsP~D}_@"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-09-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1838.274,
            durationSeconds: 1324,
            profile: "foot_fast"
          },
          encoded: "olejyAkdwgOhMkRfEmF`VoPu@uGfD_AkIy\\dH}ENqPpHeF{A{FgAyBoCeLUmCsHo]wCkKd@yFlBHAkEdCyq@j@eRl@sNv@uIrAmIrEmFnD}HhIoCX_GfDgFhb@w^|@qAuBeVuBiSiBoJ~FyH{A{GoEe]CsBe@uNjR}DdAmGnTe]bFaRdQaOmAuIc@kHIgLySy_CqAiF}CyC_A_MjFyDrNeJAsHnDg^rEaQ`CkDrBwCrHoQ~_@{h@uDeQzCsE_@Ea@M]Q[Y[[Wc@cEg^mIm^dB_KgCoGNuKpBoAzA_ExMoy@fBoLn@aJdCwn@bAsP~D}_@"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-10",
      originalPairId: "calm-route-comparison-10",
      sourceRound: 10,
      originLabel: "Mühlebach",
      destinationLabel: "Lindenhof",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-10-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 2312.825,
            durationSeconds: 1665,
            fastDurationSeconds: 1458,
            profile: "foot_calm"
          },
          encoded: "_}liyA_idiOj@uD_BwF{@oCkDsF{A_FcK_d@mFoSoDjB_BNkBKyCqAoDgCiCeBkHiCcTqAy@Ne@`AkEs@eAuBuAsAyJwDcAWu@\\aMlIiQ|MgLrXoFfHoiA~cAgd@t`@o@xBsBrDuA]oZbZi@hAqD`FgA@cF`FyMjNuB`Ek@E}@|@wGdJyY`b@MrAuBhDeXn^sL`RyA|@UnCuCrCiBAs_@rj@{BdDyQfW{DjEyNbO{Bz@if@`g@}@rAm@dBc@lDAxB_EZ}E`EqBnAkJyMaMlUaGI{CtERj@sJvLc@KuFpG@dH~DfMPdEApDmDtEy@tGyEhNvClMwGrHiKtMkMbOd@|BsF|EuNlFaOjI_JnHmJvJ_DzEoNdVcMfOmOdLqA`B{AzDqOzb@At@hAhGg@Pv@xEoC|@bAtHWtC}DjBjB`HnEh`ARnDqASmVo@mHD}Hn@eJJPx@iAbV}@rEeKyE"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-10-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 2254.78681303111,
            durationSeconds: 1623.443,
            fastDurationSeconds: 1457.945,
            profile: "foot_calm"
          },
          encoded: "_}liyA_idiOj@uD_BwF{@oCkDsF{A_FcK_d@mFoSoDjB_BNkBKyCqAoDgCiCeBkHiCcTqAy@Ne@`AkEs@eAuBuAsAyJwDcAWu@\\aMlIiQ|MgLrXoFfHoiA~cAgd@t`@o@xBsBrDuA]oZbZi@hAqD`FgA@cF`FyMjNuB`Ek@E}@|@wGdJyY`b@MrAuBhDeXn^sL`RyA|@UnCuCrCiBAs_@rj@{BdDyQfW{DjEyNbO{Bz@if@`g@}@rAm@dBc@lDAxB_EZ}E`EqBnAOtKkCnO_CdHWlE\\pH{KjSsHlK{JhKeFfFuIzIwGrHiKtMkMbOd@|BsF|EuNlFaOjI_JnHmJvJ_DzEoNdVcMfOmOdLqA`B{AzDqOzb@At@hAhGg@Pv@xEoC|@bAtHWtC}DjBjB`HnEh`ARnDqASmVo@mHD}Hn@eJJPx@iAbV}@rEeKyE"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-10-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2024.882,
            durationSeconds: 1458,
            profile: "foot_fast"
          },
          encoded: "_}liyA_idiOGb@cCxCcBhAgO`OS|AaCjBqA\\wLlKsBzCOfA}DrDm@D_WrRsCzAin@bg@_V|R_ChA_DvBeBqE{b@h^wJfHeD`DqBjBma@x\\aBtAqRbPkA~@_ChBiAhAuWbSqCnCeQbOeCvB_KhIsBzAiG~FaNtKsKdK_A}@iDzDu[hXgElDmAZsClCE|@mBzBsW|Sgp@xj@kE|EaTvZ_HbFaHhL{CrEmKlP_k@~v@mBzAcL`P{DnDaDnAqBMmB|CoGvDeMdNgNxOsJ`KqNzOoJtKwGxI}CzCyMrNiVMHvGuL|@sKfDaAvAWtC}DjBjB`HnEh`ARnDqASmVo@mHD}Hn@eJJPx@iAbV}@rEeKyE"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-11",
      originalPairId: "calm-route-comparison-11",
      sourceRound: 11,
      originLabel: "Lindenhof",
      destinationLabel: "Langstrasse",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-11-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 1543.889,
            durationSeconds: 1112,
            fastDurationSeconds: 920,
            profile: "foot_calm"
          },
          encoded: "sxgjyAqshhOAkBiPcCWEkUpFiHxBsAZPqBkAuLqByKSU_GjCgDxBwAaFoHiBeEeAYqG}EiFoCmB{Py@ApCyCZiP`BwE?oC?ue@sHcGGmAgE{CDsJbE_Eh@}CUBkAcIo@_CpB{z@uIsIw@iI{@sGZgI_@}SlEySfACcIsP_@}BbLiAxIo@lIEhEqDtKkGxEi@bDuKlo@{HbJ_C|AmBu@gBDyJpUq@lEeAtG{m@tkD@lCk@tEhHnDnG|CdHjDhHnDlHpDb@iCaAi@qFqCuMtu@qKrs@"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-11-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 1308.6499049428971,
            durationSeconds: 942.228,
            fastDurationSeconds: 919.683,
            profile: "foot_calm"
          },
          encoded: "sxgjyAqshhOAkBiPcCWEkUpFiHxBsAZsOe@_MhA_HxCaEnDyEHiS\\cNFiRVmFAaAYq@CkHI}EIsKdKaEbHiF}@YnI{Ma@]nJmBx@uK?J~EsFdCkR`Pi@nGqDrX}GrH{EyBwPoGoHaDmGna@qc@_Rs@`F{CsA{DnXyBdLgCxK_@jC}Mh_@iAjBqA]_\\i_@mGdSmCs@{D`UgHfa@y@nHOlAeFxNw@pEaAi@qFqCuMtu@qKrs@"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-11-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1277.3,
            durationSeconds: 920,
            profile: "foot_fast"
          },
          encoded: "sxgjyAqshhOAkBiPcCWEkUpFiHxBsAZ{B`K_IhJqCrGeK~B_@tAkIjA_Fg@[hFkN|Ly_@~Xgs@lh@aCz@cPbJ_JqEaAaBsDdBuDyA_^uN}GrH{EyBwPoGoHaDwc@mRyCmA_XaLuD}A}G{CiB~JoHbc@sDlRcBlAmGjCwA~Ik@@}@bEa@b@sBbOeEv]{D`UgHfa@y@nHOlAeFxNw@pEaAi@qFqCuMtu@qKrs@"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-21",
      originalPairId: "calm-route-comparison-21",
      sourceRound: 21,
      originLabel: "Wipkingen",
      destinationLabel: "Höngg",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-21-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 1598.162,
            durationSeconds: 1151,
            fastDurationSeconds: 1118,
            profile: "foot_calm"
          },
          encoded: "_`~kyA_plgOeD~P}ExYaEhd@i@jMUzO?dSp@~m@DdVi@bLaB|OaBxL{G|YeCfIl\\nQWdG~N~k@JvCe@dGfAxAn@tN`@rPnAFXYtAGjFl@vAfDtAfGh@|IHzLw@dL_BvIiDpGCjKV`Dk@hOxArDdB{ChHaREdLTzKdUr@nLdE[zErBp@b@_DrXtJxAJxCd@jAZ`[aDrCPFqBl@m@xEHzScApB{@jEyBvAw@hHbB@tBjTbBlGvBxCnBqBlTeCj\\qJxzAiExe@_CrRwAxMcIxh@~CMpBr@hEpCvCz@rApBtDhAf@vBj@a@vAcCdBZ]~CLfCrHvE?_En@qF"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-21-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 1684.2820554009395,
            durationSeconds: 1212.683,
            fastDurationSeconds: 1118.032,
            profile: "foot_calm"
          },
          encoded: "_`~kyA_plgOeD~P}ExYaEhd@eG{A_@HwG|WsA`KwBtG{BUgChQuBxPqCjPoHb\\_FfXgAvH~@r\\qCfUj@`g@RrUcBr^`@tBnEXVJzF`q@x@hDx@~AbA~@zCpCp@pArS`u@jAfDlAr@lAIpDmC~@B^XnC~ExCe@tApHl@bJSfBzLdr@|CbVbA|QjBvWzJxx@hEta@lP}FvZeNnDmAbEWfD_ApIuD~EkHlSfH@cFfIe`@dBbB`AbB|@{DnCMpGsAbDItO`E?WcAk@Fa@bBd@`CrCz@b@pCvCgCbZwDt\\gCf@_Ifi@zFlC~CMpBr@hEpCvCz@rApBtDhAf@vBj@a@vAcCdBZ]~CLfCrHvE?_En@qF"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-21-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1552.862,
            durationSeconds: 1118,
            profile: "foot_fast"
          },
          encoded: "_`~kyA_plgOeD~P}ExYaEhd@i@jMUzO?dSp@~m@DdVi@bLaB|OaBxL{G|YeCfIl\\nQWdG~N~k@JvCe@dGfAxAn@tN`@rPnAFXYtAGjFl@vAfDtAfGh@|IHzLw@dL_BvIiDpGCjKV`Dk@hOxArDdB{ChHaREdLTzKdUr@nLdE[zErBp@b@_DrXtJxAJxCd@jAZ`[aDk@dfBFbOpAb@x@vIh@pCzAnDhBrBdBbB`AbB|@{DnCMpGsAbDItO`E?WcAk@Fa@bBd@`CrCz@b@pCvCgCbZwDt\\gCf@_Ifi@zFlC~CMpBr@hEpCvCz@rApBtDhAf@vBj@a@vAcCdBZ]~CLfCrHvE?_En@qF"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-22",
      originalPairId: "calm-route-comparison-22",
      sourceRound: 23,
      originLabel: "Hottingen",
      destinationLabel: "Fluntern",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-22-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 2310.979,
            durationSeconds: 1664,
            fastDurationSeconds: 1468,
            profile: "foot_calm"
          },
          encoded: "eygjyAs~{hOtAwGdCPvSi_AcAc@~CuPg@eJoHc[gB_BqBiF`@aBAwA_ZykA_@a@mAoEIaCqN}j@uA_AiAHel@p_@uAwEi[_u@_@mBgBcDcB_@w\\qx@mRgc@oz@rbAw@nBoDpCcBb@{n@lu@cA}C]oAuXem@yI{OhHsSeDcDyKoK{Xpj@yE}FoFjJgB_CeEpIy@v@y^me@uCsDs@YmD}FeUhFqJvE{@sBeEc^cEpF}CyEhAwCf@{Dm@uGwHye@cBjA_m@lUwCsGmKeNiAuCoD{DaDtEcCaCuDiA}DA{Bf@agB~x@{Br@e@mAaAoBaMu\\{@y@sFiGyBoCwBkHwP{Xm@cB_AqDaDwBuYgc@IoEu@gEuD}GFiAxDuK"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-22-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 2175.6870325549653,
            durationSeconds: 1566.494,
            fastDurationSeconds: 1468.105,
            profile: "foot_calm"
          },
          encoded: "eygjyAs~{hOtAwGdCPvSi_AcAc@~CuPg@eJoHc[gB_BqBiF`@aBAwA_ZykA_@a@mAoEIaCqN}j@uA_AiAHel@p_@uAwEi[_u@_@mBgBcDcB_@w\\qx@mRgc@iGFks@rz@y@j@_@wAiCoY{BuRkB}LiMiq@eAgEgCNe@f@wB|EuObRuCx@[{L}@oFoDtC{AyFoK{UcIuJkEuC_DaA}HaBeIkFkOcMmDwEcCF{A~AyEmImDzAqB_CaIt@kxAz_@aGdAsBSqD}BoG}GiAa@gEuFq@aBwFwHoBmBmBQaKtCavBnp@iHjCyL~FuKdH{HxGwBkHwP{Xm@cB_AqDaDwBuYgc@IoEu@gEuD}GFiAxDuK"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-22-fast",
          source: "fast",
          metadata: {
            distanceMeters: 2039.012,
            durationSeconds: 1468,
            profile: "foot_fast"
          },
          encoded: "eygjyAs~{hO_AzGPbWf@|A~NtHcKtf@gYyWkDh@yU{TgX}VcGkD_F{@aGXqSrGqD{AcBiCiQ_s@{DzBk@MkARuLhIuA~@s@AcXmh@cEeH]b@we@`QmD{DQqKdAwG?mCgEwGwDkHeEyG_KoMgI{GuBrAaAGwIuFeO_LeCiB_B{DkEWsBCsBaBoG_HwBQyAaBqQgMwDkGmCqEWcBwDcFiFyKy]}t@gBgDuD`d@yAd@qHsBaJbDwIcEaP{KeFdQ}CyAiBMqN{JmBuBiKqH}BqFkDwEcCtBwH}EeEeD_ByAmHaJ_DiEgB}@yXy\\_BmFsIvRqDqDsD[iH{G_DkBmNgDqAkBw@mFoAuCaAoAiEwCsDiE{CqFyB}Fe@mAaAoBaMu\\{@y@sFiGyBoCwBkHwP{Xm@cB_AqDaDwBuYgc@IoEu@gEuD}GFiAxDuK"
        }
      }
    },
    {
      pairId: "calm-noise-coverage-regression-23",
      originalPairId: "calm-route-comparison-23",
      sourceRound: 25,
      originLabel: "Oberstrass",
      destinationLabel: "Wipkingen",
      scenario: "Two walking routes for the same start and destination: the route as published in the calm-curated-v2 benchmark corpus, versus the route produced by the noise-coverage routing fix (livemapai/livemap-routing#69, livemapai/data-pipeline#286) on the same PBF.",
      routes: {
        original_corpus: {
          routeId: "calm-noise-coverage-regression-23-original",
          source: "original_corpus",
          metadata: {
            distanceMeters: 1975.702,
            durationSeconds: 1423,
            fastDurationSeconds: 1422,
            profile: "foot_calm"
          },
          encoded: "oerkyAiy|hOcD`A\\tYwDtOwA`BuAdJAtG_EnAwBdB}AtCiEvMqAlB}AvAeBz@cDf@_G{@mJnSsFhTmFp\\mEta@_AdF_A|CsGvLs@vCKlBFnBdBpIdAtERxEu@vHm@bDoA`HjAff@nAly@`EC~B|Q}Fn@wBhCfCtB]jQKnQLtC[b]F~C|BjDQvHoAxbAeAhN}@lGzJrDkB|Oh@rUe@``@EpA~Gb@Ejh@JjUm@xLnFrFo@hHzApj@t@fJbA`DlBxD{BpEjB|IyAdAq@nBrAl\\fA~c@z@|Ub@tE}BrCk_@za@^XxOdg@dRlj@iPrLyIxEjAxEpAdCpMtd@VvBmBjLsDrQ}@fE}Pf|@y@`C}@vEiCdPkApFaCnEwAJeGxWnIxA{A~XWlFsJkB"
        },
        fixed_noise_coverage: {
          routeId: "calm-noise-coverage-regression-23-fixed",
          source: "fixed_noise_coverage",
          metadata: {
            distanceMeters: 1980.5332027076486,
            durationSeconds: 1425.984,
            fastDurationSeconds: 1421.564,
            profile: "foot_calm"
          },
          encoded: "oerkyAiy|hOcD`A\\tYwDtOwA`BuAdJAtGfChd@fCd_@s@dDuj@daA{IvLaKtK{K|IiKnGdAtERxEu@vHm@bDoA`HjAff@nAly@`EC~B|Q}Fn@wBhCfCtB]jQKnQLtC[b]F~CSlMg@lDqAzfAbBnE}@lGzJrDkB|Oh@rUe@``@EpA~Gb@Ejh@JjUm@xLnFrFo@hHzApj@t@fJbA`DlBxD{BpEjB|IyAdAq@nBrAl\\fA~c@z@|Ub@tE}BrCk_@za@^XxOdg@dRlj@iPrLyIxEjAxEpAdCpMtd@VvBmBjLsDrQ}@fE}Pf|@y@`C}@vEiCdPkApFaCnEwAJeGxWnIxA{A~XWlFsJkB"
        },
        fast: {
          routeId: "calm-noise-coverage-regression-23-fast",
          source: "fast",
          metadata: {
            distanceMeters: 1974.365,
            durationSeconds: 1422,
            profile: "foot_fast"
          },
          encoded: "oerkyAiy|hOcD`A\\tYwDtOwA`BuAdJAtG_EnAwBdB}AtCiEvMqAlB}AvAeBz@cDf@_G{@mJnSsFhTmFp\\mEta@_AdF_A|CsGvLs@vCKlBFnBdBpIdAtERxEu@vHm@bDoA`HjAff@nAly@`EC~B|Q}Fn@wBhCfCtB]jQKnQLtC[b]F~CSlMg@lDqAzfAbBnE}@lGzJrDkB|Oh@rUe@``@EpA~Gb@Ejh@JjUm@xLnFrFo@hHzApj@t@fJbA`DlBxD{BpEjB|IyAdAq@nBrAl\\fA~c@z@|Ub@tE}BrCk_@za@^XxOdg@dRlj@iPrLyIxEjAxEpAdCpMtd@VvBmBjLsDrQ}@fE}Pf|@y@`C}@vEiCdPkApFaCnEwAJeGxWnIxA{A~XWlFsJkB"
        }
      }
    }
  ];

  const pairs = rounds.map(round => {
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
    const referenceGeometry = routes.fast.geometry;
    const [originLat, originLng] = referenceGeometry[0];
    const [destinationLat, destinationLng] = referenceGeometry[referenceGeometry.length - 1];
    return {
      pairId: round.pairId,
      originalPairId: round.originalPairId,
      sourceRound: round.sourceRound,
      originLabel: round.originLabel,
      destinationLabel: round.destinationLabel,
      scenario: round.scenario,
      origin: { lat: originLat, lng: originLng, label: round.originLabel || 'Start' },
      destination: { lat: destinationLat, lng: destinationLng, label: round.destinationLabel || 'Destination' },
      routes
    };
  });

  pairs.corpusVersion = 'calm-noise-coverage-regression-v1';
  pairs.basedOnCorpusVersion = 'calm-curated-v2';
  pairs.sourceRounds = [1,3,5,9,10,11,21,23,25];
  return pairs;
});
