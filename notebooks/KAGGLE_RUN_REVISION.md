# Chạy thí nghiệm revision trên Kaggle

Ngày cập nhật 21 tháng 11 năm 2026. Bộ thí nghiệm chính dùng lưu lượng GloFAS v4 reanalysis tại vùng Bảo Hà và Cần Thơ, thay mục tiêu thực nghiệm là chỉ số rủi ro tổng hợp. GloFAS không phải số đo trạm và không xác thực thiệt hại hay báo cáo VGI trong bão Yagi.

## File cần dùng

Nhập `paper_submission/kaggle_revision/CuuNet_HYDRO_Revision_Kaggle_v5.ipynb` vào một Kaggle notebook private. Bản v5 giữ bootstrap dùng pip có sẵn của kernel và uv để dựng Python 3.12, không gọi `ensurepip`. Log đầu tiên có `Notebook revision: 5` và `Notebook bootstrap revision: 2`. Notebook tự chứa 19 file mã, cấu hình và dữ liệu kiểm thử có SHA-256. Không cần thêm repository làm Kaggle Dataset hoặc sao chép từng script.

Bản v5 khóa YDF 0.11.0, Protobuf 5.29.6 và setuptools 75.8.0 để sửa hai lỗi import của converter. Bản xuất dùng cùng trọng số đã huấn luyện, với dropout tắt ở chế độ suy luận, để loại thao tác cập nhật seed ngẫu nhiên gây lỗi `AssignVariableOp`. Mô hình `.keras` và cấu hình huấn luyện vẫn được lưu đầy đủ. Cả bản xuất Keras và hai GraphModel đều phải khớp với dự báo tham chiếu theo ngưỡng đã định trước. Việc đổi dự báo về đơn vị gốc dùng float64 để khớp số double của JavaScript.

Ngày 21/11, hai cấu hình attention 8 units/6 features và 64 units/3 features đã qua chuyển FP32/uint8 và đối chiếu Keras/TF.js trên Linux CPU. Log Kaggle v4 cũng xác nhận preflight synthetic qua 2.321 kiểm tra audit, rồi dừng ở bước tải GloFAS do request 5 năm vượt cost limit.

Bản v5 tải tuần tự từng năm: 25 năm × hai đoạn sông, ban đầu là 50 request. API costing chính thức đã xác nhận cả 50 request có cost tối đa 366, dưới limit 500 tại thời điểm kiểm tra. Trước mỗi lần tải, chương trình hỏi lại costing API; request vượt limit được chia tiếp theo năm, tháng hoặc ngày, giữ nguyên vùng lấy dữ liệu và toàn bộ ngày yêu cầu. Chỉ lỗi vượt kích thước mới kích hoạt chia nhỏ; lỗi giấy phép, xác thực hay giới hạn tần suất được giữ nguyên để chẩn đoán. Các file hoàn tất được kiểm tra receipt/hash để chạy tiếp khi gián đoạn.

14 kiểm thử GloFAS đã qua trên Windows và Linux/Python 3.12. Kết quả và hash được lưu trong `paper_submission/kaggle_revision/LOCAL_VALIDATION.json`. Kiểm tra cost chưa tải dữ liệu thật; chưa có xác nhận hoàn tất tải GloFAS hoặc thí nghiệm chính. Các metrics synthetic không đủ điều kiện dùng trong bài báo.

`CuuNet_revision_inputs.zip` là bản nguồn để kiểm tra hoặc chạy thủ công; không bắt buộc tải lên cùng notebook.

## Thiết lập

1. Bật Internet và chọn GPU T4. Nếu giao diện chỉ có T4 ×2, chọn mục đó; chương trình chỉ dùng GPU số 0.
2. Đăng nhập Copernicus EWDS tại `https://ewds.climate.copernicus.eu/datasets/cems-glofas-historical?tab=download` và chấp nhận giấy phép CEMS-FLOODS.
3. Lấy personal access token của tài khoản EWDS. Trong Kaggle Secrets, tạo secret có tên chính xác `CDSAPI_KEY` và cho notebook quyền truy cập.
4. Chạy các cell theo thứ tự. Token được truyền bằng biến môi trường của tiến trình con; không cần ghi vào mã, file hay gửi vào chat.

Notebook tạo Python 3.12 riêng và cài từ lockfile có hash đã được giải quyết cho Linux. Môi trường dùng TensorFlow 2.19, Keras 3.9.2 và converter/TensorFlow.js 4.22. Việc cài CUDA lần đầu có thể mất vài phút.

## Thứ tự chạy

1. Khôi phục và kiểm tra source snapshot.
2. Cài môi trường và kiểm tra một GPU khả dụng.
3. Chạy kiểm thử và preflight neural trên dữ liệu synthetic. Preflight kiểm tra toàn bộ Keras → official TF.js converter → nạp model → đối chiếu dự báo. Kết quả synthetic bị đánh dấu không đủ điều kiện đưa vào bài báo.
4. Tải tuần tự GloFAS cho 2000–2024, ban đầu 50 request theo năm và tự chia nhỏ theo cost limit; lưu request receipts, dữ liệu nguồn, hash, độ phủ ngày và ô sông được chọn chỉ từ giai đoạn huấn luyện.
5. Chạy dự báo và ablation năm seed, chọn model export chỉ từ validation, tính CI và đối chiếu số của bản FP32 với bản lưu trọng số uint8.
6. Chạy stress test Sybil 2.000 lần thử và campaign không gian 500 lần thử mỗi kịch bản, qua 10 vòng. Kiểm toán bảng tổng hợp bằng các log từng lần thử.
7. Tạo ZIP kết quả để gửi lại.

## Thiết kế đã khóa

- Dữ liệu tháng 2000–2017 cho huấn luyện, 2018–2020 cho validation, 2021–2024 cho test.
- Mục tiêu: lưu lượng trung bình tháng, đơn vị m³/s, từ reanalysis GloFAS v4.
- Dự báo một tháng tới; các đầu vào đo/reanalysis đều thuộc các tháng trước thời điểm dự báo.
- Mạng dùng lịch sử lưu lượng và hai biến chu kỳ tháng; tên đúng là Temporal Attention LSTM.
- Baselines: persistence, seasonal persistence, moving average, linear trend, seasonal decomposition, equal-weight ensemble và expected-MSE ensemble có cả bias.
- CI dùng 2.000 lần bootstrap với block dài 12 tháng. High-flow months được định nghĩa bằng percentile 90 của thời kỳ huấn luyện.
- Tháng 9/2024 là chẩn đoán held-out trên reanalysis. Chỉ đoạn sông phía Bắc trùng phạm vi địa lý của Yagi.
- Stress test Sybil dùng ground truth mô phỏng. Feedback từ oracle và feedback từ chính consensus được báo cáo riêng; không coi oracle là cảm biến đã triển khai.

## Kết quả cần gửi lại

Tải toàn bộ `CuuNet_HYDRO_revision_results_<timestamp>.zip` được tạo ở cell cuối và lưu vào `paper_submission/kaggle_results/`. Gửi đường dẫn file đó để tiếp tục revision.

ZIP chứa `manuscript_results.json`, `output_audit.json`, dữ liệu nguồn/derived và hash, dự báo từng tháng, metrics, CI, covariance/bias/weights, model từng seed, hai bản TF.js, kết quả đối chiếu số, toàn bộ log Sybil và bản source đã chạy.

Trang `browser_benchmark` chỉ chuẩn bị công cụ đo: nó chưa phải số đo điện thoại. Sau khi có model thật, cần chạy trên thiết bị có tên cụ thể, thu CSV latency và kiểm tra offline reload nếu giữ các claim tương ứng. Kaggle không tạo số đo pin, nhiệt hoặc triển khai thực địa.

## Khi một cell thất bại

Không thay các flag provenance hay `publication_eligible` để vượt kiểm tra. Giữ lại output/log lỗi. Nếu preflight thất bại, chưa chạy phần tải dữ liệu và thí nghiệm chính. Nếu quá trình tải bị gián đoạn, các phần đã tải có receipt và hash đúng sẽ được dùng lại khi chạy cell tải lần nữa.

Bốn DOCX chỉ được cập nhật từ kết quả đã qua kiểm toán và trong phạm vi `claims_eligible` của bundle.
