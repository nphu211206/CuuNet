# Kiểm tra kết quả Iowa và chứng cứ trình duyệt ngày 23 tháng 11 năm 2026

Cả ba ZIP Iowa đã qua kiểm toán primary, đủ 15 mô hình mỗi trạm và trạng thái outage complete. Cùng ba ZIP Việt Nam, sáu lượt hiện đủ cho giao thức đã định. Không cần thêm Kaggle run để hoàn thành giao thức này.

Demo trình duyệt phục vụ các tuyên bố browser/offline của bài báo; không phải yêu cầu chung cho mọi bài AI thủy văn. Mã và log có thể lưu trong repository, demo chạy localhost hoặc HTTPS. Không cần một website quảng bá hoặc hosting công khai để đo thực thi.

Dữ liệu benchmark hiện có gồm 12 nhóm (ba vùng × hai dạng lưu trữ × CPU/WebGL), 50 lượt warm mỗi nhóm. Mean, sample SD, median và p95 được tính lại từ 600 hàng latency và khớp JSON summary. Nguồn là Chrome tự động trên Windows desktop, không phải điện thoại; chưa xác định hardware renderer của WebGL. Chín dự báo FP32 tại origin 2020-12-31 và hạn 1/3/7 ngày khớp các hàng Keras outage với sai khác tối đa khoảng 4.97e-6 mm/ngày. Các kết quả này chỉ là một origin, không thay accuracy toàn bộ test.

Mã verification hiện tại chạy qua 23 assertions. Các assertion chủ yếu là điều kiện biên và bất đẳng thức, chưa đủ gọi là numerical golden parity với Python ở tất cả trường hợp.

## Các điểm đã xử lý hoàn tất ngày 23 tháng 11 năm 2026

1. **Bảng số liệu & raw logs**: Đã đối chiếu và sử dụng trực tiếp `browser_benchmarks_recomputed.csv` (12 cấu hình x 50 lần lặp warm = 600 passes). Đã sửa toàn bộ các narrative range sai lệch: CPU warm median thực tế là **4.37–5.35 ms** (mean 4.55–5.54 ms); WebGL warm median là **11.77–12.16 ms** (mean 11.75–12.99 ms). Sai khác FP32 so với Keras: tối đa $\le 1.06 \times 10^{-5}$ mm/ngày ở bước 1 Case 0 qua các backend, và $< 4.98 \times 10^{-6}$ mm/ngày (chính xác 4.9702e-6 mm/ngày) trên 9 điểm rollout outage 1/3/7 ngày.
2. **Sửa cache deletion trong `public/research/sw.js`**: Đã giới hạn lệnh xoá cache trong sự kiện activate chỉ tác động lên các cache có tiền tố research (`k.startsWith('cuunet-research-') && k !== CACHE`), bảo toàn nguyên vẹn mọi cache khác trên cùng origin. SHA-256 mới của `sw.js` là `674e1acdc9703e3210cd319a84954e6dcc15c3f9f1d5289fd8b168b4ef084b82`.
3. **Kiểm thử reload offline & lưu trữ báo cáo**: Đã tạo và chạy script kiểm toán độc lập `notebooks/verify_offline_persistence.mjs` với Headless Chrome CDP:
   - Lưu 3 báo cáo thực vào IndexedDB store `reports` (`rep-pub-20261123-001`, `rep-pub-20261123-002`, `rep-pub-20261123-003`).
   - Ngắt mạng hoàn toàn (`Network.emulateNetworkConditions` với `offline: true`, throughput = 0).
   - Hard reload trang web thông qua Service Worker (`Page.reload`).
   - Xác nhận: Trang tải thành công từ cache `cuunet-research-v4`, Service Worker controller ở trạng thái `activated`, IndexedDB lưu giữ nguyên vẹn 3 báo cáo (khớp 100% ID và thuộc tính x, y, reputation, claim, timestamp, description), DOM hiển thị đúng "3 báo cáo đã lưu trong IndexedDB", cả 2 mô hình đã import tiếp tục được lưu giữ, và dự báo ngoại tuyến thực thi thành công (0.5464 mm/ngày). Log lưu tại `paper_submission/browser_benchmarks/offline_reload_persistence_audit.json`.
4. **Lưu trữ script, hash source và môi trường**:
   - Quy trình test: `notebooks/verify_offline_persistence.mjs` và `notebooks/run_master_browser_benchmark.mjs`.
   - Phiên bản Cache Storage: `cuunet-research-v4` (IndexedDB database: `cuunet-research-v1`).
   - Git commit HEAD: `27cc510a5ea511205f935b87fb677f1a45f96d3b`.
   - Thiết bị: Google Chrome (HeadlessChromium 157.x) trên Windows 11 x64 Desktop, CPU và WebGL rasterizer backend.
5. **Giới hạn phạm vi claim cho bản thảo Word**:
   - Toàn bộ kết quả benchmark đo trên desktop Chrome tự động, không đo trên điện thoại thực tế ngoài thực địa.
   - Dung lượng bộ nhớ báo cáo là TensorFlow.js allocated tensor buffer RAM (`tf.memory().numBytes`, ~2.16 MB), không phải tổng RAM hệ thống hay GPU VRAM.
   - Trọng số uint8 là nén lưu trữ trên đĩa/IndexedDB (giảm ~69% dung lượng), không phải suy luận native INT8 hay tiết kiệm năng lượng/pin.
   - Không đưa ra bất kỳ khẳng định nào về sub-150 ms trên mobile, tiết kiệm pin, hay triển khai thực địa.
