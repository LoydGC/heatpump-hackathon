# Xcel Energy Minnesota residential rates (energy charge, cents/kWh) — for smart-controller scenarios

Status: Xcel's official rate book (Minnesota Electric Rate Book, schedules A01 standard, A72/A74 Residential Time of Use) is the authority:
https://www.xcelenergy.com/company/rates_and_regulations/rates/rate_books  (select Minnesota). Values below are from secondary reporting — VERIFY before final numbers.

## Standard residential (flat) energy charge
- Winter (Oct–May): ~11.364 c/kWh energy charge; summer (Jun–Sep) ~13.069 c/kWh (KSTP, Xcel figures cited in TOU proposal coverage)
  https://kstp.com/kstp-news/top-news/xcel-wants-to-charge-more-during-peak-time-company-says-new-plan-can-save-customers-money/
- All-in average incl. riders/fixed: ~16.4 c/kWh (EIA, see eia_mn_residential_electricity.csv)

## Residential Time of Use (proposal as reported; winter values)
- Peak 3–8 pm weekdays: ~19 c/kWh;  Off-peak 12–6 am: ~4 c/kWh;  Base (all other hours): ~9.5 c/kWh  (KARE11)
  https://kare11.com/article/news/local/breaking-the-news/xcel-energy-surge-pricing/89-0eb19c9d-ace8-477f-8c63-3e83455fec80
- Earlier MN TOU pilot: peak 3–8 pm 22.6 c (winter), super-off-peak 12–6 am 5.7 c, other hours 10.6 c (OATI summary)
  https://www.oati.com/?p=3871

## Model use
Scenario A "flat": 16.4 c/kWh all hours (EIA all-in).
Scenario B "TOU": scale the reported winter TOU energy charges so the load-weighted average matches the all-in level, i.e. add riders (~5 c/kWh) to each period:
  peak (weekday 15–20h) ~24 c, base ~14.5 c, off-peak (0–6h) ~9 c.  -> flagged as an assumption.
