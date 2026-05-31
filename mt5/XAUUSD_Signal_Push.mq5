//+------------------------------------------------------------------+
//| XAUUSD Signal Push EA                                           |
//| Gửi klines XAUUSD lên Signal Nexus mỗi 10 giây                 |
//|                                                                  |
//| Hướng dẫn cài:                                                  |
//| 1. Chép file này vào: MT5 > File > Open Data Folder >           |
//|    MQL5 > Experts                                               |
//| 2. Tools > Options > Expert Advisors > Allowed URLs:            |
//|    Thêm: https://qisignals.vercel.app                           |
//| 3. Attach EA lên chart XAUUSD (bất kỳ timeframe nào)           |
//+------------------------------------------------------------------+
#property strict

input string AppURL        = "https://qisignals.vercel.app/api/mt5-klines";
input string MT5Secret     = "";   // Để trống nếu không dùng bảo mật
input int    UpdateSeconds = 10;   // Gửi mỗi bao nhiêu giây
input int    CandleCount   = 200;  // Số nến gửi mỗi lần
input string SendSymbol    = "XAUUSD"; // Tên symbol gửi lên server

// Timeframes cần gửi
ENUM_TIMEFRAMES TF_LIST[4] = {PERIOD_M5, PERIOD_M15, PERIOD_H1, PERIOD_H4};
string          TF_NAMES[4] = {"M5", "M15", "H1", "H4"};

//+------------------------------------------------------------------+
int OnInit()
{
   EventSetTimer(UpdateSeconds);
   Print("XAUUSD Signal Push EA started. Sending to: ", AppURL);
   // Gửi ngay lần đầu
   SendAllTimeframes();
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTimer()
{
   SendAllTimeframes();
}

//+------------------------------------------------------------------+
void SendAllTimeframes()
{
   for(int i = 0; i < ArraySize(TF_LIST); i++)
   {
      SendKlines(TF_LIST[i], TF_NAMES[i]);
   }
}

//+------------------------------------------------------------------+
void SendKlines(ENUM_TIMEFRAMES tf, string tfName)
{
   MqlRates rates[];
   int copied = CopyRates(_Symbol, tf, 0, CandleCount, rates);
   if(copied <= 0)
   {
      Print("CopyRates failed for ", tfName, " error: ", GetLastError());
      return;
   }

   string json = BuildJSON(tfName, rates, copied);

   char   postData[];
   char   response[];
   string responseHeaders;
   string headers = "Content-Type: application/json\r\n";

   // Thêm secret header nếu có cấu hình
   if(StringLen(MT5Secret) > 0)
      headers += "X-MT5-Secret: " + MT5Secret + "\r\n";

   StringToCharArray(json, postData, 0, StringLen(json));
   // Xóa ký tự null cuối do StringToCharArray thêm vào
   ArrayResize(postData, ArraySize(postData) - 1);

   int statusCode = WebRequest("POST", AppURL, headers, 5000, postData, response, responseHeaders);

   if(statusCode == -1)
      Print("WebRequest error [", tfName, "]: ", GetLastError(),
            " — Kiểm tra Allowed URLs trong Tools > Options > Expert Advisors");
   else if(statusCode != 200)
      Print("Server returned ", statusCode, " for ", tfName);
   else
      Print("Sent ", tfName, ": ", copied, " candles OK");
}

//+------------------------------------------------------------------+
string BuildJSON(string tfName, MqlRates &rates[], int count)
{
   string json = "{\"symbol\":\"" + SendSymbol + "\","
               + "\"timeframe\":\"" + tfName + "\","
               + "\"klines\":[";

   for(int i = 0; i < count; i++)
   {
      if(i > 0) json += ",";
      json += "{"
            + "\"openTime\":"  + IntegerToString((long)rates[i].time * 1000) + ","
            + "\"open\":"      + DoubleToString(rates[i].open,  _Digits) + ","
            + "\"high\":"      + DoubleToString(rates[i].high,  _Digits) + ","
            + "\"low\":"       + DoubleToString(rates[i].low,   _Digits) + ","
            + "\"close\":"     + DoubleToString(rates[i].close, _Digits) + ","
            + "\"volume\":"    + IntegerToString(rates[i].tick_volume)
            + "}";
   }

   json += "]}";
   return json;
}
